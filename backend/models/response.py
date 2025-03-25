from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Any


class FeedbackItem(BaseModel):
    """
    Model for individual feedback for each rubric criterion
    """
    points_awarded: int = Field(..., description="Points awarded for this criterion")
    max_points: int = Field(..., description="Maximum possible points for this criterion")
    feedback: str = Field(..., description="Detailed feedback explaining the evaluation")


class RubricPoint(BaseModel):
    """
    Model for individual points in a rubric item
    """
    description: str = Field(..., description="Description of the rubric point")
    satisfied: bool = Field(..., description="Whether the point is satisfied or not")
    justification: str = Field(..., description="Justification for the satisfaction status")


class RubricItemEvaluation(BaseModel):
    """
    Model for the evaluation of a single rubric item
    """
    points_awarded: int = Field(..., description="Points awarded for this rubric item")
    max_points: int = Field(..., description="Maximum possible points for this rubric item")
    points: List[RubricPoint] = Field(..., description="Evaluation of individual points")
    feedback: str = Field(..., description="Overall feedback for this rubric item")


class EvaluationResponse(BaseModel):
    """
    Response model for code evaluation results
    """
    score: int = Field(..., description="Total score awarded")
    max_score: int = Field(..., description="Maximum possible score")
    feedback: Dict[str, FeedbackItem] = Field(..., description="Detailed feedback for each rubric item")
    error: Optional[str] = Field(None, description="Error message, if any")


class SecurityCheckResponse(BaseModel):
    """
    Response model for security check results
    """
    is_secure: bool = Field(..., description="Whether the submission passed security checks")
    issues_detected: Optional[List[str]] = Field(None, description="List of detected security issues")


class EnsembleResult(BaseModel):
    """
    Model for storing results from ensemble evaluation
    """
    evaluations: List[Dict[str, Any]] = Field(..., description="Individual evaluations from different models")
    final_evaluation: Dict[str, Any] = Field(..., description="Aggregated final evaluation")
    agreement_score: float = Field(..., description="Agreement score among the ensemble")



class SubmissionResponse(BaseModel):
    """
    Response model for code submission status
    """
    submission_id: str = Field(..., description="Unique identifier for the submission")
    status: str = Field(..., description="Status of the submission (processing, completed, failed)")
    timestamp: str = Field(..., description="Timestamp when the submission was created")