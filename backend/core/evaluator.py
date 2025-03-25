import json
import logging
from typing import Dict, List, Tuple, Any, Optional
from agents.rubric_extractor_agent import RubricExtractorAgent
from models.request import EvaluationRequest, EnsembleEvaluationRequest
from models.response import EvaluationResponse, FeedbackItem, EnsembleResult
from utils.rubric_parser import parse_rubric, get_total_marks, identify_best_approach, format_rubric_for_llm
from utils.security import check_for_injection, detection_based_check, create_security_wrapper
from utils.sanitizer import process_inputs
from agents.evaluation_guidance_agent import EvaluationGuidanceAgent
from agents.approach_explanation_agent import ApproachExplanationAgent
from utils.llm_utils import query_llm
from core.llm_client import (
    construct_evaluation_prompt,
    parse_llm_response
)
from config import (
    SECURITY_CHECK_ENABLED,
    DETECTION_CHECKS_ENABLED
)

logger = logging.getLogger(__name__)

async def complete_rubric_evaluation(request: EvaluationRequest) -> Dict[str, Any]:
    """
    Implement Complete Rubric Evaluation (CRE) as described in the paper
    
    Args:
        request: Evaluation request containing problem, rubric, and code
        
    Returns:
        Evaluation results
    """
    # Process and sanitize inputs
    problem, rubric_text, code = process_inputs(
        request.problem_statement,
        request.rubric,
        request.student_code
    )
    
    # Parse the rubric
    parsed_rubric = parse_rubric(rubric_text)
    
    # Create a secure prompt for the LLM
    prompt = await construct_evaluation_prompt(
        problem,
        rubric_text,
        code,
        model_solution=request.model_solution,
    )
    
    # Secure the prompt
    secured_prompt = create_security_wrapper(prompt)
    
    # Query the LLM
    response_text = await query_llm(secured_prompt)
    
    # Parse the response
    evaluation = parse_llm_response(response_text)
    
    return evaluation


async def pointwise_rubric_evaluation(request: EvaluationRequest) -> Dict[str, Any]:
    """
    Implement Pointwise Rubric Evaluation (PRE) as described in the paper
    
    Args:
        request: Evaluation request containing problem, rubric, and code
        
    Returns:
        Evaluation results with per-point scores
    """
    # Process and sanitize inputs
    problem, rubric_text, code = process_inputs(
        request.problem_statement,
        request.rubric,
        request.student_code
    )
    
    # Parse the rubric
    parsed_rubric = parse_rubric(rubric_text)
    
    # Identify the best approach (or try all if needed)
    best_approach = identify_best_approach(parsed_rubric)
    approach_points = parsed_rubric["approaches"][best_approach]["points"]
    
    results = {
        "approach_used": best_approach,
        "evaluation": {},
        "total_score": 0,
        "max_possible_score": get_total_marks(parsed_rubric),
        "feedback": ""
    }
    
    # Evaluate each point individually
    for point in approach_points:
        point_id = point["id"]
        description = point["description"]
        max_marks = point["marks"]
        
        # Format the prompt for this specific point
        point_prompt = f"""
        You are evaluating a student's code submission against a specific criterion.
        
        PROBLEM:
        {problem}
        
        CRITERION: {description} [{max_marks} mark(s)]
        
        STUDENT CODE:
        ```
        {code}
        ```
        
        Evaluate if the student's code satisfies this SPECIFIC criterion ONLY.
        Respond with a JSON object with the following structure:
        {{
            "satisfied": true/false,
            "justification": "Brief explanation",
            "marks_awarded": marks_value (0 to {max_marks})
        }}
        
        Only return the JSON object, nothing else.
        """
        
        # Secure the prompt
        secured_point_prompt = create_security_wrapper(point_prompt)
        
        # Query the LLM
        point_response = await query_llm(secured_point_prompt)
        
        try:
            # Parse the response
            point_evaluation = json.loads(point_response)
            
            # Add to results
            results["evaluation"][point_id] = point_evaluation
            results["total_score"] += point_evaluation.get("marks_awarded", 0)
            
        except json.JSONDecodeError:
            logger.error(f"Failed to parse point evaluation response: {point_response}")
            # Create a default failed evaluation
            results["evaluation"][point_id] = {
                "satisfied": False,
                "justification": "Failed to evaluate this criterion",
                "marks_awarded": 0
            }
    
    # Generate overall feedback
    feedback_prompt = f"""
    Based on the evaluation results below, provide a concise summary feedback 
    for the student's code submission.
    
    PROBLEM:
    {problem}
    
    EVALUATION RESULTS:
    {json.dumps(results["evaluation"], indent=2)}
    
    TOTAL SCORE: {results["total_score"]} / {results["max_possible_score"]}
    
    Provide helpful, constructive feedback in 3-5 sentences.
    """
    
    feedback_response = await query_llm(feedback_prompt)
    results["feedback"] = feedback_response.strip()
    
    return results

async def evaluate_submission(request: EvaluationRequest) -> EvaluationResponse:
    """
    Main function to evaluate a submission using the appropriate technique
    with enhanced algorithm-specific guidance from examples
    
    Args:
        request: Evaluation request with problem, rubric, and code
        
    Returns:
        Evaluation response with score and feedback
    """
    try:
        # Process inputs for better handling
        problem, rubric_text, code = process_inputs(
            request.problem_statement,
            request.rubric,
            request.student_code
        )
        
        # Create agents
        rubric_extractor = RubricExtractorAgent()
        approach_explainer = ApproachExplanationAgent()
        
        # First, generate the approach explanation once
        try:
            approach_explanation = await approach_explainer.explain_approach(
                code,
                problem  # Pass problem statement for context
            )
            logger.info(f"Generated approach explanation: {approach_explanation.get('approach_name', 'Unknown')}")
        except Exception as e:
            logger.error(f"Error getting approach explanation: {str(e)}")
            approach_explanation = {}
        
        # Extract the appropriate rubric based on the solution, passing the pre-generated approach explanation
        extracted_rubric = await rubric_extractor.extract_rubric_for_solution(
            problem,
            rubric_text,
            code,
            request.model_solution,
            approach_explanation  # Pass the pre-generated approach explanation
        )
        
        # Get the correctly formatted rubric for evaluation
        formatted_rubric = await rubric_extractor.format_rubric_for_evaluation(extracted_rubric)
        
        # Format the approach explanation for the evaluator
        formatted_approach_explanation = approach_explainer.format_approach_explanation_for_evaluator(approach_explanation)
        
        # Log the extracted approach and max score
        logger.info(f"Using approach: {extracted_rubric['approach']} with max score: {extracted_rubric['max_score']}")
        
        # Store the rubric points for reference to get correct max_points later
        rubric_points = {}
        if extracted_rubric["is_custom"]:
            for i, point in enumerate(extracted_rubric["custom_rubric"]["points"]):
                rubric_points[str(i+1)] = point["marks"]
        else:
            for i, point in enumerate(extracted_rubric["rubric"]["points"]):
                rubric_points[str(i+1)] = point["marks"]
        
        logger.info(f"Rubric points mapping: {rubric_points}")
        
        # Determine if there's a problem directory with examples
        problem_dir = None
        if hasattr(request, 'problem_dir') and request.problem_dir:
            problem_dir = request.problem_dir
        
        # Generate algorithm-specific guidance using the extracted approach
        guidance_agent = EvaluationGuidanceAgent()
        algorithm_guidance = await guidance_agent.generate_evaluation_guidance(
            problem,
            extracted_rubric,  # Pass the full extracted rubric object
            problem_dir=problem_dir
        )

        # Use the generated guidance to construct a more informed evaluation prompt
        evaluation_prompt = await construct_evaluation_prompt(
            problem,
            formatted_rubric,
            code,
            model_solution=request.model_solution,
            algorithm_guidance=algorithm_guidance,
            approach_explanation=formatted_approach_explanation,
            problem_dir=problem_dir
        )
        
        # Create a secure version of the prompt
        secured_evaluation_prompt = create_security_wrapper(evaluation_prompt)
        
        # Query the LLM directly with our enhanced evaluation prompt
        response_text = await query_llm(secured_evaluation_prompt)
        
        # Parse the response
        evaluation = parse_llm_response(response_text)
        
        # Convert the evaluation to a structured response
        feedback_dict = {}
        total_score = 0
        
        for point_id, point_eval in evaluation.get("evaluation", {}).items():
            # Get max_points from the parsed rubric instead of the LLM evaluation
            max_points = rubric_points.get(point_id, 1)  # Default to 1 if not found
            
            # Ensure points_awarded never exceeds max_points
            points_awarded = min(point_eval.get("marks_awarded", 0), max_points)
            
            feedback_dict[point_id] = FeedbackItem(
                points_awarded=points_awarded,
                max_points=max_points,
                feedback=point_eval.get("justification", "")
            )
            
            total_score += points_awarded
        
        # Use the max_score from the extracted rubric
        return EvaluationResponse(
            score=total_score,  # Use our calculated total instead of the LLM's
            max_score=extracted_rubric["max_score"],
            feedback=feedback_dict,
            error=None
        )
        
    except Exception as e:
        logger.error(f"Error evaluating submission: {str(e)}", exc_info=True)
        return EvaluationResponse(
            score=0,
            max_score=0,
            feedback={},
            error=f"An error occurred during evaluation: {str(e)}"
        )