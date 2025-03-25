from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Any


class RubricItem(BaseModel):
    """
    Model for an individual item in a rubric
    """
    id: str = Field(..., description="Unique identifier for the rubric item")
    description: str = Field(..., description="Description of the rubric item")
    points: int = Field(..., description="Maximum points for the rubric item")
    solution_approach: Optional[str] = Field(None, description="Which solution approach this rubric item belongs to")


class RubricPoint(BaseModel):
    """
    Model for an individual point within a rubric item
    """
    description: str = Field(..., description="Description of the rubric point")
    marks: int = Field(..., description="Marks allocated to this point")


class StructuredRubric(BaseModel):
    """
    Model for a structured rubric with multiple approaches
    """
    title: str = Field(..., description="Title of the problem")
    approaches: Dict[str, List[RubricPoint]] = Field(..., description="Different approaches and their rubric points")
    

class EvaluationRequest(BaseModel):
    """
    Request model for code evaluation
    """
    model_config = {"protected_namespaces": ()}
    
    problem_statement: str = Field(..., description="The problem statement to be solved")
    rubric: str = Field(..., description="Evaluation rubric text")
    student_code: str = Field(..., description="The student's code submission")
    model_solution: Optional[str] = Field(None, description="Model solution for reference")
    language: str = Field("java", description="Programming language of the code")
    problem_dir: Optional[str] = Field(None, description="Path to directory with example solutions and feedback")

class SecurityCheckRequest(BaseModel):
    """
    Request model for security checking
    """
    code: str = Field(..., description="Code to check for security issues")
    context: Optional[str] = Field(None, description="Additional context for security checking")


class EnsembleEvaluationRequest(BaseModel):
    """
    Request model for ensemble evaluation
    """
    model_config = {"protected_namespaces": ()}
    
    problem_statement: str = Field(..., description="The problem statement")
    rubric: str = Field(..., description="Evaluation rubric")
    student_code: str = Field(..., description="The student's code submission")
    model_solution: Optional[str] = Field(None, description="Model solution")
    ensemble_size: int = Field(2, description="Number of models to use in ensemble")
    language: str = Field("java", description="Programming language of the code")
    
    

class SubmissionRequest(BaseModel):
    """
    Request model for code submissions from the frontend
    """
    model_config = {"protected_namespaces": ()}
    
    problem_statement: str = Field(..., description="The problem statement to be solved")
    rubric: str = Field(..., description="Evaluation rubric text")
    student_code: str = Field(..., description="The student's code submission")
    language: str = Field("java", description="Programming language of the code")
    model_solution: Optional[str] = Field(None, description="Model solution for reference")