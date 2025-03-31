from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel
import logging

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)
from app.db.database import get_db
from app.db.models import Problem, Submission, EvaluationStatus, User, EvaluationDetail
from app.services.evaluation_service import EvaluationService, EvaluationRequest, EvaluationResponse
from app.services.llm_client_service import LLMClientService
from app.utils.security import check_for_injection
from app.api.auth_api import get_current_user

# Create router
router = APIRouter(prefix="/evaluation", tags=["Evaluation"])

# Request models
class SubmissionRequest(BaseModel):
    problem_id: int
    code: str
    language: str = "java"

class EvaluationHistoryRequest(BaseModel):
    submission_id: int

# Response models
class SubmissionResponse(BaseModel):
    submission_id: int
    status: str
    message: str

# Initialize services
evaluation_service = EvaluationService()
llm_client_service = LLMClientService()

# Helper function to update submission status and score
async def _update_submission_status(
    db: Session, 
    submission_id: int, 
    status: EvaluationStatus, 
    score: Optional[float] = None,
    error: Optional[str] = None
):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if submission:
        submission.evaluation_status = status
        if score is not None:
            submission.total_score = score
        db.commit()
        
# Background task for asynchronous evaluation
async def _process_evaluation(
    submission_id: int,
    problem_id: int,
    code: str,
    language: str,
    db: Session
):
    try:
        # Update status to 'processing'
        await _update_submission_status(db, submission_id, EvaluationStatus.pending)
        
        # Get problem from database
        problem = db.query(Problem).filter(Problem.id == problem_id).first()
        if not problem:
            await _update_submission_status(db, submission_id, EvaluationStatus.error)
            return
        
        # Prepare evaluation request
        eval_request = EvaluationRequest(
            problem_statement=problem.problem_description,
            rubric=problem.rubric,
            student_code=code,
            language=language
        )
        
        # Perform evaluation
        result = await evaluation_service.evaluate_submission(eval_request)
        
        # Update submission with results
        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if submission:
            submission.evaluation_status = EvaluationStatus.completed
            submission.total_score = result.score
            
            # Save detailed evaluation results
            for point_id, feedback_item in result.feedback.items():
                detail = EvaluationDetail(
                    submission_id=submission_id,
                    criterion_index=int(point_id),
                    max_score=feedback_item.max_points,
                    score_obtained=feedback_item.points_awarded,
                    feedback=feedback_item.feedback
                )
                db.add(detail)
            
            db.commit()
            
    except Exception as e:
        # Update status to 'error' on exception
        await _update_submission_status(db, submission_id, EvaluationStatus.error)
        logger.error(f"Error in evaluation process: {str(e)}", exc_info=True)

@router.post("/submit", response_model=SubmissionResponse)
async def submit_code(
    request: SubmissionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit code for evaluation
    """
    # Check if problem exists
    problem = db.query(Problem).filter(Problem.id == request.problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )
    
    # Perform security check
    has_injection, issues = check_for_injection(request.code)
    if has_injection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security check failed: {', '.join(issues)}"
        )
    
    # Create submission record
    submission = Submission(
        user_id=current_user.id,
        problem_id=request.problem_id,
        code=request.code,
        language=request.language,
        evaluation_status=EvaluationStatus.pending
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # Queue evaluation as background task
    background_tasks.add_task(
        _process_evaluation,
        submission.id,
        request.problem_id,
        request.code,
        request.language,
        db
    )
    
    return SubmissionResponse(
        submission_id=submission.id,
        status="pending",
        message="Submission received and queued for evaluation"
    )

@router.get("/status/{submission_id}")
async def check_evaluation_status(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check the status of a submission
    """
    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Return different response based on status
    if submission.evaluation_status == EvaluationStatus.pending:
        return {
            "submission_id": submission.id,
            "status": "pending",
            "message": "Evaluation in progress"
        }
    elif submission.evaluation_status == EvaluationStatus.completed:
        return {
            "submission_id": submission.id,
            "status": "completed",
            "score": submission.total_score,
            "max_score": submission.problem.rubric_max_score if hasattr(submission.problem, "rubric_max_score") else None,
        }
    else:
        return {
            "submission_id": submission.id,
            "status": "error",
            "message": "An error occurred during evaluation"
        }

@router.get("/results/{submission_id}", response_model=EvaluationResponse)
async def get_evaluation_results(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed evaluation results for a submission
    """
    # Check if submission exists and belongs to user
    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Check if evaluation is complete
    if submission.evaluation_status != EvaluationStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Evaluation is not complete. Current status: {submission.evaluation_status.value}"
        )
    
    # Get evaluation details
    details = db.query(EvaluationDetail).filter(
        EvaluationDetail.submission_id == submission_id
    ).all()
    
    # Convert to feedback dict
    feedback_dict = {}
    for detail in details:
        feedback_dict[str(detail.criterion_index)] = {
            "points_awarded": detail.score_obtained,
            "max_points": detail.max_score,
            "feedback": detail.feedback
        }
    
    # Calculate max score from details
    max_score = sum(detail.max_score for detail in details)
    
    return EvaluationResponse(
        score=submission.total_score,
        max_score=max_score,
        feedback=feedback_dict,
        error=None
    )

@router.get("/history")
async def get_submission_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get submission history for the current user
    """
    submissions = db.query(Submission).filter(
        Submission.user_id == current_user.id
    ).order_by(Submission.submission_time.desc()).all()
    
    result = []
    for submission in submissions:
        result.append({
            "submission_id": submission.id,
            "problem_id": submission.problem_id,
            "problem_title": submission.problem.title if submission.problem else "Unknown",
            "submission_time": submission.submission_time,
            "status": submission.evaluation_status.value,
            "score": submission.total_score if submission.evaluation_status == EvaluationStatus.completed else None,
        })
    
    return result

@router.get("/problems")
async def get_available_problems(
    db: Session = Depends(get_db)
):
    """
    Get list of available problems
    """
    problems = db.query(Problem).all()
    
    result = []
    for problem in problems:
        result.append({
            "problem_id": problem.id,
            "title": problem.title,
            "topic": problem.topic,
        })
    
    return result

@router.get("/problem/{problem_id}")
async def get_problem_details(
    problem_id: int,
    db: Session = Depends(get_db)
):
    """
    Get details of a specific problem
    """
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )
    
    return {
        "problem_id": problem.id,
        "title": problem.title,
        "description": problem.problem_description,
        "topic": problem.topic,
        # Don't return the rubric to the client
    }