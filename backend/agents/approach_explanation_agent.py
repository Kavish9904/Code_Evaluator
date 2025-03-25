import logging
import json
import re
import html
from typing import Dict, List, Any, Optional

from utils.llm_utils import query_llm
from utils.sanitizer import process_inputs, extract_language_from_code,remove_java_comments

logger = logging.getLogger(__name__)

class ApproachExplanationAgent:
    """
    Agent that analyzes student code and provides a step-by-step explanation
    of the approach used, along with identification of any issues without suggesting fixes.
    """
    
    def __init__(self):
        pass
        
    async def explain_approach(self, student_code: str, problem_statement: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze the student's code and provide a detailed explanation of the approach used,
        identifying any issues without suggesting fixes.
        
        Args:
            student_code: The student's code submission
            problem_statement: Optional problem statement for context
            
        Returns:
            Dictionary containing approach explanation and identified issues
        """
        try:
            # Try to detect the programming language
            language = extract_language_from_code(student_code)
            
            # Unescape any HTML entities in the code before analysis
            unescaped_code = html.unescape(student_code)
            
            # Sanitize the code without HTML escaping
            # We're manually using the unescaped version for analysis
            _, _, sanitized_code = process_inputs("", "", unescaped_code)
            
            # Set up problem statement section if provided
            problem_section = ""
            if problem_statement:
                problem_section = f"PROBLEM STATEMENT:\n```\n{problem_statement}\n```\n"
            
            # JSON format template
            json_format = """{
                "approach_name": "Brief name of the algorithm/approach",
                "explanation": "Detailed step-by-step explanation of the code",
                "algorithm_details": "Description of the algorithm(s) used",
                "time_complexity": "Big O analysis of time complexity",
                "space_complexity": "Big O analysis of space complexity",
                "issues_identified": ["List of issues without suggested fixes"],
                "correct_implementation": true/false
            }"""
            
            # Create a prompt for approach explanation
            unescaped_code=remove_java_comments(unescaped_code)
            explanation_prompt = f"""
            You are an expert code analyzer. Your task is to thoroughly analyze the given code and explain the approach
            it implements step-by-step. Do NOT suggest improvements or fixes; only identify issues if they exist.
            
            {problem_section}
            
            STUDENT CODE ({language}):
            ```
            {unescaped_code}
            ```
            
            INSTRUCTIONS:
            1. Provide a detailed step-by-step explanation of how the code works
            2. Identify the algorithm(s) or data structure(s) being used
            3. Explain the overall approach and logic flow
            4. Calculate the time and space complexity of the implementation
            5. Identify any logical errors or edge cases not handled properly
            6. Flag any syntax errors or implementation issues
            7. Do NOT suggest fixes or improvements - only identify issues
            8. Focus on what the code ACTUALLY DOES, not what it's supposed to do
            9. Do NOT flag HTML entity issues (like &lt; or &gt;) as these are display artifacts, not code issues
            
            FORMAT YOUR ANALYSIS AS A JSON OBJECT WITH THE FOLLOWING FIELDS:
            {json_format}
            
            Return only the JSON object and nothing else.
            """
            
            # Query LLM for approach explanation
            response = await query_llm(explanation_prompt, temperature=0.2)
            
            # Parse the response
            try:
                # Try to extract JSON from the response
                json_match = re.search(r'(\{.*\})', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    approach_explanation = json.loads(json_str)
                else:
                    approach_explanation = json.loads(response)
                
                # Filter out any issues related to HTML entities
                if "issues_identified" in approach_explanation:
                    filtered_issues = [
                        issue for issue in approach_explanation["issues_identified"]
                        if not any(term in issue.lower() for term in ["html", "entity", "&lt;", "&gt;", "escaped"])
                    ]
                    approach_explanation["issues_identified"] = filtered_issues
                    
                    # Update correct_implementation based on remaining issues
                    approach_explanation["correct_implementation"] = len(filtered_issues) == 0
                
                logger.info(f"Generated approach explanation for: {approach_explanation.get('approach_name', 'unknown approach')}")
                return approach_explanation
                
            except json.JSONDecodeError:
                logger.error(f"Failed to parse approach explanation response: {response}")
                # Fall back to a simpler format
                return {
                    "approach_name": "Unknown approach",
                    "explanation": "Could not generate a structured explanation of the code.",
                    "algorithm_details": "Unknown algorithm",
                    "time_complexity": "Unknown",
                    "space_complexity": "Unknown",
                    "issues_identified": ["Failed to analyze the code properly"],
                    "correct_implementation": False
                }
                
        except Exception as e:
            logger.error(f"Error explaining approach: {str(e)}", exc_info=True)
            return {
                "approach_name": "Analysis Error",
                "explanation": f"Error analyzing code: {str(e)}",
                "algorithm_details": "Unknown",
                "time_complexity": "Unknown",
                "space_complexity": "Unknown",
                "issues_identified": [f"Error during analysis: {str(e)}"],
                "correct_implementation": False
            }
    
    def format_approach_explanation_for_evaluator(self, approach_explanation: Dict[str, Any]) -> str:
        """
        Format the approach explanation for inclusion in the evaluator prompt.
        
        Args:
            approach_explanation: The approach explanation dictionary
            
        Returns:
            Formatted explanation text for the evaluator
        """
        approach_name = approach_explanation.get("approach_name", "Unknown Approach")
        explanation = approach_explanation.get("explanation", "")
        algorithm_details = approach_explanation.get("algorithm_details", "")
        time_complexity = approach_explanation.get("time_complexity", "Unknown")
        space_complexity = approach_explanation.get("space_complexity", "Unknown")
        issues = approach_explanation.get("issues_identified", [])
        correct = approach_explanation.get("correct_implementation", False)
        
        # Handle issues list formatting
        issues_text = "None identified"
        if issues:
            issues_text = "- " + "\n- ".join(issues)
        
        # Implementation status text
        implementation_status = "Correct implementation" if correct else "Has implementation issues"
        
        formatted_text = f"""
        STUDENT'S APPROACH ANALYSIS:
        ---------------------------
        Approach: {approach_name}
        
        Explanation:
        {explanation}
        
        Algorithm Details:
        {algorithm_details}
        
        Complexity:
        - Time: {time_complexity}
        - Space: {space_complexity}
        
        Implementation Status: {implementation_status}
        
        Issues Identified:
        {issues_text}
        """
        
        return formatted_text