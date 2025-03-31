import logging
import json
import re
import os
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field, validator

from app.utils.llm_utils import query_llm
from app.utils.sanitizer import process_inputs

logger = logging.getLogger(__name__)

class AlgorithmGuidance(BaseModel):
    """Schema for algorithm-specific evaluation guidance"""
    algorithm_type: str = Field("Unknown", description="The specific algorithm type used in this approach")
    algorithm_guidance: str = Field("", description="Detailed guidance for evaluating this approach")
    test_cases: str = Field("", description="Representative test cases with expected outputs")
    common_errors: str = Field("", description="Common mistakes and misconceptions")
    key_implementation_patterns: str = Field("", description="Key patterns that indicate a correct implementation")
    misleading_patterns: str = Field("", description="Misleading patterns that should be ignored during evaluation")

    @validator('algorithm_guidance', 'test_cases', 'common_errors', 'key_implementation_patterns', 'misleading_patterns', pre=True)
    def convert_to_string(cls, v):
        """
        Convert input to a string, handling various input types
        """
        if v is None:
            return ""
        
        # If it's a list or dict, convert to a formatted string
        if isinstance(v, (list, dict)):
            try:
                # Use json.dumps for dictionaries to preserve structure
                if isinstance(v, dict):
                    return json.dumps(v, indent=2)
                
                # For lists, join into a multi-line string
                return "\n".join(str(item) for item in v)
            except Exception as e:
                logger.warning(f"Could not convert {type(v)} to string: {e}")
                return str(v)
        
        # If it's already a string, return as-is
        return str(v)

class Examples(BaseModel):
    """Schema for example solutions and feedback"""
    correct: List[Dict[str, str]] = []
    incorrect: Dict[str, str] = {}
    editorial: Optional[str] = None
    feedback: Dict[str, str] = {}

class EvaluationGuidanceAgent:
    """
    Agent that generates algorithm-specific evaluation guidance and test cases
    based on the problem statement, rubric, and example solutions.
    """
    
    async def load_examples(self, problem_dir: str) -> Examples:
        """
        Load example solutions and feedback from the provided directory structure
        
        Args:
            problem_dir: Path to the problem directory containing examples
            
        Returns:
            Examples object containing examples and their feedback
        """
        examples_dict = {
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
                    examples_dict["editorial"] = f.read()
            
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
                                examples_dict["correct"].append({
                                    "name": subdir,
                                    "code": solution
                                })
                            else:
                                examples_dict["incorrect"][subdir] = solution
            
            # Load feedback
            feedback_dir = os.path.join(problem_dir, "feedbacks")
            if os.path.exists(feedback_dir):
                for feedback_file in os.listdir(feedback_dir):
                    if feedback_file.endswith(".txt"):
                        with open(os.path.join(feedback_dir, feedback_file), 'r', encoding='utf-8') as f:
                            submission_type = feedback_file.replace("feedback_", "").replace(".txt", "")
                            examples_dict["feedback"][submission_type] = f.read()
            
            logger.info(f"Loaded {len(examples_dict['correct'])} correct examples and {len(examples_dict['incorrect'])} incorrect examples")
            return Examples(**examples_dict)
            
        except Exception as e:
            logger.error(f"Error loading examples: {str(e)}", exc_info=True)
            return Examples()
        
    async def generate_evaluation_guidance(
        self,
        problem_statement: str,
        extracted_rubric: Dict[str, Any],
        problem_dir: Optional[str] = None
    ) -> AlgorithmGuidance:
        """
        Generate algorithm-specific guidance and test cases for evaluating code
        based on the extracted approach from the rubric_extractor_agent
        
        Args:
            problem_statement: The problem statement
            extracted_rubric: The approach extracted by the rubric_extractor_agent
            problem_dir: Optional path to directory with example solutions
            
        Returns:
            AlgorithmGuidance containing guidance and test cases
        """
        try:
            # Sanitize problem statement
            clean_problem, _, _ = process_inputs(
                problem_statement, "", ""  # Only sanitize the problem statement
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
            if examples and examples.editorial:
                example_prompt += f"""
                EDITORIAL SOLUTION:
                ```
                {examples.editorial}
                ```
                """
            
            if examples and examples.correct:
                example_prompt += "\nCORRECT SOLUTION EXAMPLES:\n"
                # Limit to max 2 correct examples to keep prompt size reasonable
                for i, example in enumerate(examples.correct[:2]):
                    example_prompt += f"""
                    CORRECT EXAMPLE {i+1}:
                    ```
                    {example["code"]}
                    ```
                    """
            
            if examples and examples.incorrect and examples.feedback:
                example_prompt += "\nCOMMON ERRORS AND FEEDBACK:\n"
                # Include 1-2 examples of incorrect solutions with feedback
                for error_type, code in list(examples.incorrect.items())[:2]:
                    if error_type in examples.feedback:
                        example_prompt += f"""
                        ERROR TYPE: {error_type}
                        CODE:
                        ```
                        {code}
                        ```
                        FEEDBACK:
                        {examples.feedback[error_type]}
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
            
            Format your response as a JSON object with string values for all fields. 
            Specifically:
            - algorithm_type: String naming the algorithm
            - algorithm_guidance: Detailed text guidance for evaluation
            - test_cases: Text description of representative test cases
            - common_errors: Text description of common implementation mistakes
            - key_implementation_patterns: Text description of correct implementation patterns
            - misleading_patterns: Text description of patterns to ignore
            """
            
            # Query LLM for algorithm guidance
            response = await query_llm(guidance_prompt, temperature=0.3)
            
            # Parse the response
            try:
                # Try to extract JSON from the response
                json_match = re.search(r'(\{.*\})', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    guidance_dict = json.loads(json_str)
                else:
                    guidance_dict = json.loads(response)
                
                # Ensure all fields are strings with a fallback
                fields = [
                    'algorithm_type', 
                    'algorithm_guidance', 
                    'test_cases', 
                    'common_errors', 
                    'key_implementation_patterns', 
                    'misleading_patterns'
                ]
                
                for field in fields:
                    if field not in guidance_dict or guidance_dict[field] is None:
                        # Provide a default string value
                        guidance_dict[field] = f"No specific {field} provided for {approach_name}"
                
                # Create AlgorithmGuidance object
                algorithm_guidance = AlgorithmGuidance(**guidance_dict)
                logger.info(f"Generated evaluation guidance for algorithm type: {algorithm_guidance.algorithm_type}")
                return algorithm_guidance
                
            except (json.JSONDecodeError, TypeError) as e:
                logger.error(f"Failed to parse guidance response: {response}")
                # Fallback to default guidance
                return AlgorithmGuidance(
                    algorithm_type=approach_name,
                    algorithm_guidance=f"""
                    When evaluating code for approach '{approach_name}', consider both explicit and implicit correctness.
                    Focus on whether the code implements the core algorithm pattern correctly, regardless of how it's described.
                    Analyze what the code actually does, not what comments claim it does.
                    Consider multiple valid implementation variations that achieve the same algorithmic goal.
                    """,
                    test_cases="No specific test cases provided.",
                    common_errors="No common errors identified.",
                    key_implementation_patterns=f"""
                    IMPORTANT: Focus on the actual code logic, not comments or variable names.
                    
                    For approach '{approach_name}':
                    1. Correct initialization of necessary variables and data structures
                    2. Proper implementation of the core algorithm logic
                    3. Appropriate handling of edge cases
                    4. Correct computation and return of results
                    
                    The code should be evaluated based on its actual behavior, not how it describes itself.
                    """,
                    misleading_patterns="No specific misleading patterns identified."
                )
                
        except Exception as e:
            logger.error(f"Error generating evaluation guidance: {str(e)}", exc_info=True)
            # Return a basic fallback guidance
            approach_name = extracted_rubric.get("approach", "Unknown") if extracted_rubric else "Unknown"
            return AlgorithmGuidance(
                algorithm_type=approach_name,
                algorithm_guidance=f"""
                When evaluating code for approach '{approach_name}', consider both explicit and implicit correctness.
                Focus on whether the code implements the core algorithm pattern correctly, regardless of how it's described.
                Analyze what the code actually does, not what comments claim it does.
                Consider multiple valid implementation variations that achieve the same algorithmic goal.
                """,
                test_cases="No specific test cases provided.",
                common_errors="No common errors identified.",
                key_implementation_patterns=f"""
                IMPORTANT: Focus on the actual code logic, not comments or variable names.
                
                For approach '{approach_name}':
                1. Correct initialization of necessary variables and data structures
                2. Proper implementation of the core algorithm logic
                3. Appropriate handling of edge cases
                4. Correct computation and return of results
                
                The code should be evaluated based on its actual behavior, not how it describes itself.
                """,
                misleading_patterns="No specific misleading patterns identified."
            )