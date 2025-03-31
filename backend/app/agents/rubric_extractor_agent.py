import json
import logging
import re
import asyncio
from typing import Dict, List, Any, Tuple, Optional
from pydantic import BaseModel, Field

from app.agents.approach_explanation_agent import ApproachExplanationAgent, ApproachExplanation
from app.utils.rubric_parser import parse_rubric, get_approach_marks
from app.utils.llm_utils import query_llm
from app.utils.sanitizer import process_inputs, remove_java_comments

logger = logging.getLogger(__name__)
nl = "\n"

class ApproachEvaluation(BaseModel):
    """Schema for approach evaluation result"""
    approach: str
    confidence: float = 0.0
    explanation: str = ""
    key_indicators: List[str] = []

class ExtractedRubric(BaseModel):
    """Schema for extracted rubric information"""
    is_custom: bool = False
    approach: str
    rubric: Dict[str, Any]
    explanation: str
    original_rubric: Dict[str, Any]
    max_score: int
    all_evaluations: List[ApproachEvaluation]
    approach_explanation: Optional[ApproachExplanation] = None

class RubricExtractorAgent:
    """
    Agent responsible for extracting and selecting the most appropriate rubric approach
    based on student solution. Evaluates each approach in parallel without knowledge of other approaches.
    """
    
    def print_parsed_rubric(self, parsed_rubric: Dict[str, Any]) -> None:
        """
        Print the parsed rubric structure for debugging
        """
        print(json.dumps(parsed_rubric, indent=2))
    
    async def extract_rubric_for_solution(
        self, 
        problem_statement: str, 
        rubric: str, 
        solution_code: str,
        model_solution: Optional[str] = None,
        approach_explanation: Optional[ApproachExplanation] = None
    ) -> ExtractedRubric:
        """
        Extract relevant rubric information based on the provided solution.
        Evaluates each approach in parallel and selects the one with highest confidence,
        augmented by ApproachExplanationAgent insights.
        
        Args:
            problem_statement: The problem statement
            rubric: The evaluation rubric text
            solution_code: The student's solution code
            model_solution: Optional model solution provided by instructor
            approach_explanation: Optional pre-generated approach explanation
            
        Returns:
            ExtractedRubric containing the extracted rubric information
        """
        # Process and sanitize inputs
        solution_without_comments = remove_java_comments(solution_code)
        
        clean_problem, clean_rubric, clean_solution = process_inputs(
            problem_statement, rubric, solution_without_comments
        )
        
        # Parse the rubric structure
        parsed_rubric = parse_rubric(clean_rubric)
        
        # First, run the parallel approach evaluation
        approach_results = await self._evaluate_approaches_in_parallel(
            clean_problem, 
            parsed_rubric, 
            clean_solution,
            model_solution
        )
        
        # If approach explanation is not provided, generate it
        if approach_explanation is None:
            approach_explainer = ApproachExplanationAgent()
            try:
                approach_explanation = await approach_explainer.explain_approach(
                    solution_code, 
                    problem_statement
                )
                logger.info(f"Generated approach explanation: {approach_explanation.approach_name}")
            except Exception as e:
                logger.error(f"Error getting approach explanation: {str(e)}")
                approach_explanation = None
        
        # Augment approach results with explanation insights (if available)
        augmented_approach_results = []
        if approach_explanation:
            augmented_approach_results = self._augment_approach_results(
                approach_results, 
                approach_explanation, 
                parsed_rubric
            )
        else:
            augmented_approach_results = approach_results
        
        # Select best approach with augmented information
        best_approach = self._select_best_approach(
            augmented_approach_results, 
            parsed_rubric
        )
        
        # Get approach name and details
        approach_name = best_approach["approach"]
        confidence = best_approach["confidence"]
        explanation = best_approach["explanation"]
        
        logger.info(f"Selected best approach: {approach_name} with confidence {confidence}")
        approach_max_score = get_approach_marks(parsed_rubric, approach_name)
        logger.info(f"Approach {approach_name} has a maximum score of {approach_max_score}")
        
        # Convert approach evaluations to model instances
        approach_evaluation_models = [
            ApproachEvaluation(**eval_result) for eval_result in augmented_approach_results
        ]
        
        # Create and return the ExtractedRubric model
        return ExtractedRubric(
            is_custom=False,
            approach=approach_name,
            rubric=parsed_rubric["approaches"][approach_name],
            explanation=explanation,
            original_rubric=parsed_rubric,
            max_score=approach_max_score,
            all_evaluations=approach_evaluation_models,
            approach_explanation=approach_explanation
        )
    
    def _augment_approach_results(
        self, 
        approach_results: List[Dict[str, Any]], 
        approach_explanation: ApproachExplanation,
        parsed_rubric: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Augment approach results with insights from approach explanation
        
        Args:
            approach_results: Original approach evaluation results
            approach_explanation: Explanation from ApproachExplanationAgent
            parsed_rubric: Parsed rubric structure
            
        Returns:
            Augmented approach results
        """
        # If no approach results, return original
        if not approach_results:
            return approach_results
        
        # Try to match the approach explanation with one of the approaches
        explanation_approach = approach_explanation.approach_name.lower()
        
        # Augment confidence based on approach explanation
        augmented_results = []
        for result in approach_results:
            current_result = result.copy()
            
            # Check if approach name matches or is similar
            approach_name = current_result.get('approach', '').lower()
            current_confidence = current_result.get('confidence', 0)
            
            # Boost confidence if approach names are similar or match
            if explanation_approach in approach_name or approach_name in explanation_approach:
                # If approach matches, boost confidence
                boost_factor = 0.2
                current_result['confidence'] = min(1.0, current_confidence + boost_factor)
                current_result['explanation'] += f"\n\nApproach Explanation Boost: Detected matching approach '{explanation_approach}'"
            
            # Add complexity insights if available
            time_complexity = approach_explanation.time_complexity
            space_complexity = approach_explanation.space_complexity
            
            if time_complexity != 'Unknown' or space_complexity != 'Unknown':
                current_result['explanation'] += f"\n\nComplexity Insights:\n- Time Complexity: {time_complexity}\n- Space Complexity: {space_complexity}"
            
            # Check for implementation correctness
            implementation_correct = approach_explanation.correct_implementation
            if not implementation_correct:
                # Reduce confidence if implementation has issues
                current_result['confidence'] = max(0, current_result['confidence'] - 0.2)
                current_result['explanation'] += "\n\nWarning: Approach explanation identified potential implementation issues"
            
            # Add any specific issues identified
            issues = approach_explanation.issues_identified
            if issues:
                current_result['explanation'] += "\n\nIssues Identified:\n" + "\n".join(f"- {issue}" for issue in issues)
            
            augmented_results.append(current_result)
        
        return augmented_results    

    async def _evaluate_single_approach(
        self,
        problem_statement: str,
        approach_name: str,
        approach_details: Dict[str, Any],
        sanitized_solution_code: str,
        model_solution: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a single approach against the student solution
        
        Args:
            problem_statement: The problem statement
            approach_name: Name of the approach being evaluated
            approach_details: Details of the approach
            sanitized_solution_code: The sanitized student's solution code
            model_solution: Optional model solution
            
        Returns:
            Evaluation result with confidence
        """
        # Format approach description
        approach_description = f"{approach_name}: {approach_details['name']}\n"
        for i, point in enumerate(approach_details["points"]):
            approach_description += f"  {i+1}. {point['description']} [{point['marks']} marks]\n"
        
        # Create prompt for evaluating this specific approach
        evaluation_prompt = f"""
        You are an expert code evaluator specializing in identifying programming approaches.

        PROBLEM STATEMENT:
        ```
        {problem_statement}
        ```

        YOU ARE EVALUATING THE FOLLOWING APPROACH ONLY:
        {approach_description}

        STUDENT SOLUTION (SANITIZED):
        ```
        {sanitized_solution_code}
        ```

        {"MODEL SOLUTION:" + nl + "```" + nl + model_solution + nl + "```" + nl if model_solution else ""}

        INSTRUCTIONS:
        1. Analyze the student's solution carefully, focusing on the algorithm and implementation style
        2. Determine how well it matches the specific approach described above
        3. Consider algorithm characteristics like time complexity, space usage, and implementation pattern
        4. Identify specific evidence in the code that supports or contradicts this approach
        5. You are ONLY evaluating this ONE approach - you don't know about any other possible approaches
        6. Be objective and thorough in your analysis

        RESPONSE FORMAT:
        Return a JSON object with the following structure:
        {{
            "approach": "{approach_name}",
            "confidence": 0.0-1.0,
            "explanation": "Detailed explanation with specific code evidence for why this confidence level was assigned",
            "key_indicators": ["List of specific code patterns that indicate this approach"]
        }}
        
        The confidence score should reflect how likely it is that the student's solution follows this approach:
        - 0.8-1.0: Strong match with clear evidence
        - 0.5-0.8: Moderate match with some differences
        - 0.3-0.5: Weak match with significant differences
        - 0.0-0.3: Very poor match, fundamentally different approach

        Only return the JSON object and nothing else.
        """
        try:
            # Query the LLM
            response = await query_llm(evaluation_prompt, temperature=0.1)
            
            # Extract JSON from response
            json_match = re.search(r'(\{.*\})', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                result = json.loads(json_str)
            else:
                result = json.loads(response)
            
            # Ensure approach name is correct
            result["approach"] = approach_name
            
            return result
            
        except Exception as e:
            logger.error(f"Error evaluating approach {approach_name}: {str(e)}", exc_info=True)
            return {
                "approach": approach_name,
                "confidence": 0.0,
                "explanation": f"Error during evaluation: {str(e)}",
                "key_indicators": []
            }
    
    async def _evaluate_approaches_in_parallel(
        self,
        problem_statement: str,
        parsed_rubric: Dict[str, Any],
        sanitized_solution_code: str,
        model_solution: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluate all approaches in parallel
        
        Args:
            problem_statement: The problem statement
            parsed_rubric: Parsed rubric structure
            sanitized_solution_code: The sanitized student's solution code
            model_solution: Optional model solution
            
        Returns:
            List of evaluation results for each approach
        """
        tasks = []
        
        # Create a task for each approach
        for approach_name, approach_details in parsed_rubric["approaches"].items():
            task = self._evaluate_single_approach(
                problem_statement,
                approach_name,
                approach_details,
                sanitized_solution_code,
                model_solution
            )
            tasks.append(task)
        
        # Run all tasks in parallel
        results = await asyncio.gather(*tasks)
        
        return results
    
    def _select_best_approach(
        self, 
        approach_results: List[Dict[str, Any]],
        parsed_rubric: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Select the best approach based on confidence scores
        
        Args:
            approach_results: Results from parallel approach evaluations
            parsed_rubric: Parsed rubric structure
            
        Returns:
            The selected best approach
        """
        # Sort by confidence score in descending order
        sorted_results = sorted(approach_results, key=lambda x: x.get("confidence", 0), reverse=True)
        
        # If we have results, return the highest confidence one
        if sorted_results and sorted_results[0].get("confidence", 0) > 0:
            best_approach = sorted_results[0]
            
            # Add comparison with other approaches
            other_approaches = sorted_results[1:]
            if other_approaches:
                comparison = "Comparison with other approaches:\n"
                for i, approach in enumerate(other_approaches):
                    confidence_diff = best_approach["confidence"] - approach["confidence"]
                    comparison += f"- {approach['approach']}: {approach['confidence']:.2f} " \
                                 f"({confidence_diff:.2f} lower confidence)\n"
                
                best_approach["explanation"] += f"\n\n{comparison}"
            
            return best_approach
        
        # Fallback if no approach has confidence > 0
        fallback_approach = next(iter(parsed_rubric["approaches"].keys()))
        logger.warning(f"No approach with positive confidence found, falling back to {fallback_approach}")
        
        return {
            "approach": fallback_approach,
            "confidence": 0.1,
            "explanation": "No approach matched with positive confidence. Using fallback approach."
        }
    
    async def format_rubric_for_evaluation(self, extracted_rubric: ExtractedRubric) -> str:
        """
        Format the extracted rubric information for use in evaluation.
        
        Args:
            extracted_rubric: The extracted rubric information
            
        Returns:
            Formatted rubric text for evaluation
        """
        # Format standard rubric
        approach = extracted_rubric.approach
        rubric_info = extracted_rubric.rubric
        result = [f"# {approach}: {rubric_info['name']}"]
        
        for i, point in enumerate(rubric_info["points"]):
            result.append(f"{i+1}. {point['description']} [{point['marks']} marks]")
        
        return "\n".join(result)