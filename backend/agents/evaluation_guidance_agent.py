import logging
import json
import re
import os
from typing import Dict, List, Any, Optional, Tuple

from utils.llm_utils import query_llm, query_multiple_llms
from utils.sanitizer import process_inputs

logger = logging.getLogger(__name__)

class EvaluationGuidanceAgent:
    """
    Agent that generates algorithm-specific evaluation guidance and test cases
    based on the problem statement, rubric, and example solutions.
    """
    
    def __init__(self):
        pass
        
    async def load_examples(self, problem_dir: str) -> Dict[str, Any]:
        """
        Load example solutions and feedback from the provided directory structure
        
        Args:
            problem_dir: Path to the problem directory containing examples
            
        Returns:
            Dictionary containing examples and their feedback
        """
        examples = {
            "correct": [],
            "incorrect": {},
            "editorial": None,
            "feedback": {}
        }
        
        try:
            # Load editorial if available
            editorial_path = os.path.join(problem_dir, "editorial.txt")
            if os.path.exists(editorial_path):
                with open(editorial_path, 'r', encoding='utf-8') as f:
                    examples["editorial"] = f.read()
            
            # Load submissions
            submissions_dir = os.path.join(problem_dir, "submissions")
            if os.path.exists(submissions_dir):
                # Process each submission type
                for subdir in os.listdir(submissions_dir):
                    solution_path = os.path.join(submissions_dir, subdir, "Solution.java")
                    
                    if os.path.exists(solution_path):
                        with open(solution_path, 'r', encoding='utf-8') as f:
                            solution = f.read()
                            
                            # Categorize as correct or incorrect
                            if subdir.startswith("Correct"):
                                examples["correct"].append({
                                    "name": subdir,
                                    "code": solution
                                })
                            else:
                                examples["incorrect"][subdir] = solution
            
            # Load feedback
            feedback_dir = os.path.join(problem_dir, "feedbacks")
            if os.path.exists(feedback_dir):
                for feedback_file in os.listdir(feedback_dir):
                    if feedback_file.endswith(".txt"):
                        with open(os.path.join(feedback_dir, feedback_file), 'r', encoding='utf-8') as f:
                            submission_type = feedback_file.replace("feedback_", "").replace(".txt", "")
                            examples["feedback"][submission_type] = f.read()
            
            logger.info(f"Loaded {len(examples['correct'])} correct examples and {len(examples['incorrect'])} incorrect examples")
            return examples
            
        except Exception as e:
            logger.error(f"Error loading examples: {str(e)}", exc_info=True)
            return examples
        
    async def generate_evaluation_guidance(
        self,
        problem_statement: str,
        extracted_rubric: Dict[str, Any],  # Changed from rubric: str to extracted_rubric: Dict[str, Any]
        problem_dir: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generate algorithm-specific guidance and test cases for evaluating code
        based on the extracted approach from the rubric_extractor_agent
        
        Args:
            problem_statement: The problem statement
            extracted_rubric: The approach extracted by the rubric_extractor_agent
            problem_dir: Optional path to directory with example solutions
            
        Returns:
            Dictionary containing algorithm guidance and test cases
        """
        try:
            # Sanitize problem statement
            clean_problem, _, _ = process_inputs(
                problem_statement, "", ""  # Only need to sanitize the problem statement
            )
            
            # Get approach information from the extracted_rubric
            approach_name = extracted_rubric.get("approach", "Unknown")
            explanation = extracted_rubric.get("explanation", "")
            
            # Format the rubric points from the extracted approach
            approach_rubric = ""
            if not extracted_rubric.get("is_custom", False) and "rubric" in extracted_rubric:
                for i, point in enumerate(extracted_rubric["rubric"]["points"]):
                    approach_rubric += f"{i+1}. {point['description']} [{point['marks']} marks]\n"
            
            # Load examples if directory is provided
            examples = None
            if problem_dir and os.path.exists(problem_dir):
                examples = await self.load_examples(problem_dir)
            
            # Extract example information for the prompt
            example_prompt = ""
            if examples and examples["editorial"]:
                example_prompt += f"""
                EDITORIAL SOLUTION:
                ```
                {examples["editorial"]}
                ```
                """
            
            if examples and examples["correct"]:
                example_prompt += "\nCORRECT SOLUTION EXAMPLES:\n"
                # Limit to max 2 correct examples to keep prompt size reasonable
                for i, example in enumerate(examples["correct"][:2]):
                    example_prompt += f"""
                    CORRECT EXAMPLE {i+1}:
                    ```
                    {example["code"]}
                    ```
                    """
            
            if examples and examples["incorrect"] and examples["feedback"]:
                example_prompt += "\nCOMMON ERRORS AND FEEDBACK:\n"
                # Include 1-2 examples of incorrect solutions with feedback
                for error_type, code in list(examples["incorrect"].items())[:2]:
                    if error_type in examples["feedback"]:
                        example_prompt += f"""
                        ERROR TYPE: {error_type}
                        CODE:
                        ```
                        {code}
                        ```
                        FEEDBACK:
                        {examples["feedback"][error_type]}
                        """
            
            # Create a prompt for generating algorithm guidance
            guidance_prompt = f"""
            You are an expert in algorithms and code evaluation. Your task is to create specific guidance for evaluating 
            student code submissions for a particular problem against a specific approach from the rubric.
            
            PROBLEM STATEMENT:
            ```
            {clean_problem}
            ```
            
            SELECTED APPROACH: {approach_name}
            
            APPROACH DESCRIPTION:
            {explanation}
            
            RUBRIC POINTS FOR THIS APPROACH:
            {approach_rubric}
            
            {example_prompt}
            
            INSTRUCTIONS:
            1. Create specialized guidance for evaluating code against this specific approach
            2. Include implementation variations that are valid for this approach
            3. Describe edge cases and boundary conditions that should be considered
            4. Create 4-5 representative test cases with expected outputs for this approach
            5. List common errors students make when implementing this approach
            
            CRITICAL EVALUATION PRINCIPLES:
            - Focus on what the code ACTUALLY DOES, not what comments claim it does
            - Students may use misleading variable names or comments (intentionally or unintentionally)
            - Analyze the actual algorithm implementation pattern and logic flow rather than descriptions
            - Consider algorithmic correctness based on behavior, not naming conventions
            - Check for actual time and space complexity based on implementation, not based on comments
            - A correct implementation can use different styles and variable names but must follow the core algorithm pattern
            
            Your response should be structured as a JSON object with the following fields:
            {{
                "algorithm_type": "The specific algorithm type used in this approach",
                "algorithm_guidance": "Detailed guidance for evaluating this approach with all its valid variations",
                "test_cases": "Representative test cases with expected outputs for verification",
                "common_errors": "Common mistakes and misconceptions when implementing this approach",
                "key_implementation_patterns": "Key patterns that indicate a correct implementation regardless of comments or variable names",
                "misleading_patterns": "Common misleading comments or variable names that should be ignored during evaluation"
            }}
            
            Your guidance should be specific to this approach and problem, not generic or hardcoded.
            """
            
            # Query LLM for algorithm guidance
            response = await query_llm(guidance_prompt, temperature=0.3)
            
            # Parse the response
            try:
                # Try to extract JSON from the response
                json_match = re.search(r'(\{.*\})', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    guidance = json.loads(json_str)
                else:
                    guidance = json.loads(response)
                
                # Add base implementation note to key_implementation_patterns if it exists
                base_implementation_note = """
                IMPORTANT: When evaluating implementations, focus on the actual code logic and operations performed,
                not on comments or variable names which may be misleading. Look for the essential algorithmic patterns
                regardless of how they are described in the comments.
                """
                
                if "key_implementation_patterns" in guidance:
                    # Check if it's a string
                    if isinstance(guidance["key_implementation_patterns"], str):
                        if not guidance["key_implementation_patterns"].startswith("IMPORTANT"):
                            guidance["key_implementation_patterns"] = base_implementation_note + guidance["key_implementation_patterns"]
                    # If it's a list, convert to string first
                    elif isinstance(guidance["key_implementation_patterns"], list):
                        patterns_text = "\n".join([str(pattern) for pattern in guidance["key_implementation_patterns"]])
                        guidance["key_implementation_patterns"] = base_implementation_note + patterns_text
                    # For any other type, use string conversion
                    else:
                        guidance["key_implementation_patterns"] = base_implementation_note + str(guidance["key_implementation_patterns"])
                else:
                    guidance["key_implementation_patterns"] = base_implementation_note + """
                    1. Correct initialization of necessary variables and data structures
                    2. Proper control flow and algorithmic structure
                    3. Appropriate handling of edge cases
                    4. Correct computation and return of results
                    """
                
                # If misleading_patterns doesn't exist, add it
                if "misleading_patterns" not in guidance:
                    guidance["misleading_patterns"] = """
                    Watch out for:
                    1. Comments claiming incorrect time complexity when the actual implementation is optimal
                    2. Variable names that suggest a different algorithm than what's implemented
                    3. Comments that incorrectly describe what the code is doing
                    4. Deliberately obfuscated variable names or misleading function names
                    5. Code that claims to be "simplified" or "elegant" while actually implementing the correct algorithm
                    
                    Always trace through the actual execution flow to determine what the code really does.
                    """
                print(guidance)
                return guidance
                
            except json.JSONDecodeError:
                logger.error(f"Failed to parse guidance response: {response}")
                # Fall back to a standard guidance with emphasis on actual implementation
                return {
                    "algorithm_type": approach_name,
                    "algorithm_guidance": f"""
                    When evaluating code for approach '{approach_name}', consider both explicit and implicit correctness.
                    Focus on whether the code implements the core algorithm pattern correctly, regardless of how it's described.
                    Analyze what the code actually does, not what comments claim it does.
                    Consider multiple valid implementation variations that achieve the same algorithmic goal.
                    """,
                    "test_cases": "",
                    "common_errors": "",
                    "key_implementation_patterns": f"""
                    IMPORTANT: Focus on the actual code logic, not comments or variable names.
                    
                    For approach '{approach_name}':
                    1. Correct initialization of necessary variables and data structures
                    2. Proper implementation of the core algorithm logic
                    3. Appropriate handling of edge cases
                    4. Correct computation and return of results
                    
                    The code should be evaluated based on its actual behavior, not how it describes itself.
                    """,
                    "misleading_patterns": """
                    1. Comments that misrepresent the time/space complexity
                    2. Variable names that suggest different algorithms
                    3. Comments that incorrectly describe the algorithm being used
                    4. Misleading function names or descriptions
                    """
                }
                
        except Exception as e:
            logger.error(f"Error generating evaluation guidance: {str(e)}", exc_info=True)
            # Return a basic fallback guidance with emphasis on actual implementation
            approach_name = extracted_rubric.get("approach", "Unknown") if extracted_rubric else "Unknown"
            return {
                "algorithm_type": approach_name,
                "algorithm_guidance": f"""
                When evaluating code for approach '{approach_name}', consider both explicit and implicit correctness.
                Focus on whether the code implements the core algorithm pattern correctly, regardless of how it's described.
                Analyze what the code actually does, not what comments claim it does.
                Consider multiple valid implementation variations that achieve the same algorithmic goal.
                """,
                "test_cases": "",
                "common_errors": "",
                "key_implementation_patterns": f"""
                IMPORTANT: Focus on the actual code logic, not comments or variable names.
                
                For approach '{approach_name}':
                1. Correct initialization of necessary variables and data structures
                2. Proper implementation of the core algorithm logic
                3. Appropriate handling of edge cases
                4. Correct computation and return of results
                
                The code should be evaluated based on its actual behavior, not how it describes itself.
                """,
                "misleading_patterns": """
                1. Comments that misrepresent the time/space complexity
                2. Variable names that suggest different algorithms
                3. Comments that incorrectly describe the algorithm being used
                4. Misleading function names or descriptions
                """
            }