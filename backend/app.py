from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
import asyncio
import uuid
from typing import Optional, Dict, List
from datetime import datetime
import os

from models.request import EvaluationRequest, EnsembleEvaluationRequest, SecurityCheckRequest, SubmissionRequest
from models.response import EvaluationResponse, SecurityCheckResponse, SubmissionResponse
from core.evaluator import evaluate_submission
from utils.security import check_for_injection, detection_based_check, create_security_wrapper
from config import APP_HOST, APP_PORT, DEBUG_MODE, LOG_LEVEL

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("llm_evaluator.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="LLM Code Evaluation System",
    description="A secure system for evaluating student code submissions using LLMs",
    version="1.0.0"
)

# Add CORS middleware with more permissive settings for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for submissions and results
# In a production environment, you would use a database
submissions_store = {}

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"Request: {request.method} {request.url.path} - Completed in {process_time:.4f}s")
    
    return response

# Error handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "An internal server error occurred"}
    )

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the LLM Code Evaluation System API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Standard evaluation endpoint (existing)
@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_code(request: EvaluationRequest):
    try:
        return await evaluate_submission(request)
    except Exception as e:
        logger.error(f"Error in /evaluate: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Security check endpoint (existing)
@app.post("/security-check", response_model=SecurityCheckResponse)
async def check_code_security(request: SecurityCheckRequest):
    try:
        # Perform static checks
        has_injection, issues = check_for_injection(request.code)
        
        if has_injection:
            return SecurityCheckResponse(
                is_secure=False,
                issues_detected=issues
            )
            
        # Perform LLM-based detection check
        detection_result = await detection_based_check(request.code)
        return detection_result
    except Exception as e:
        logger.error(f"Error in /security-check: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# NEW FRONTEND API ENDPOINTS

async def process_submission(submission_id: str, request: SubmissionRequest):
    """Background task to process a submission"""
    try:
        # Convert the SubmissionRequest to an EvaluationRequest
        eval_request = EvaluationRequest(
            problem_statement=request.problem_statement,
            rubric=request.rubric,
            student_code=request.student_code,
            language=request.language,
            model_solution=request.model_solution,
            problem_dir=None  # Not including problem_dir for frontend submissions
        )
        
        # Evaluate the submission
        result = await evaluate_submission(eval_request)
        
        # Store the result
        submissions_store[submission_id]["status"] = "completed"
        submissions_store[submission_id]["result"] = result
        
    except Exception as e:
        logger.error(f"Error processing submission {submission_id}: {str(e)}", exc_info=True)
        submissions_store[submission_id]["status"] = "failed"
        submissions_store[submission_id]["error"] = str(e)

@app.post("/api/submissions", response_model=SubmissionResponse)
async def submit_code(request: SubmissionRequest, background_tasks: BackgroundTasks):
    """
    Handle new code submissions from the frontend
    """
    try:
        # Generate a unique ID for this submission
        submission_id = str(uuid.uuid4())
        
        # Store the submission
        submissions_store[submission_id] = {
            "status": "processing",
            "timestamp": datetime.now().isoformat(),
            "result": None,
            "error": None
        }
        
        # Process the submission in the background
        background_tasks.add_task(process_submission, submission_id, request)
        
        return SubmissionResponse(
            submission_id=submission_id,
            status="processing",
            timestamp=submissions_store[submission_id]["timestamp"]
        )
    except Exception as e:
        logger.error(f"Error creating submission: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/submissions/{submission_id}/status")
async def get_submission_status(submission_id: str):
    """
    Get the status of a submission
    """
    if submission_id not in submissions_store:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return {
        "submission_id": submission_id,
        "status": submissions_store[submission_id]["status"],
        "timestamp": submissions_store[submission_id]["timestamp"]
    }

@app.get("/api/submissions/{submission_id}/results")
async def get_submission_results(submission_id: str):
    """
    Get the evaluation results for a submission
    """
    if submission_id not in submissions_store:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission = submissions_store[submission_id]
    
    if submission["status"] == "processing":
        return {
            "submission_id": submission_id,
            "status": "processing",
            "message": "Evaluation is still in progress"
        }
    
    if submission["status"] == "failed":
        return {
            "submission_id": submission_id,
            "status": "failed",
            "error": submission["error"]
        }
    
    # Return the evaluation results
    return submission["result"]

# Add this after the existing endpoints
@app.get("/questions")
async def get_questions():
    """Get all questions from the DSA Dataset"""
    try:
        questions = load_questions_from_dataset()
        return questions
    except Exception as e:
        logger.error(f"Error getting questions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def load_questions_from_dataset() -> List[Dict]:
    """Load questions from the DSA Dataset directory"""
    questions = []
    dataset_path = "DSA Dataset"
    
    # Get all category directories
    categories = [d for d in os.listdir(dataset_path) 
                 if os.path.isdir(os.path.join(dataset_path, d)) and not d.startswith('.')]
    
    for category in categories:
        category_path = os.path.join(dataset_path, category)
        # Get all question directories in this category
        question_dirs = [d for d in os.listdir(category_path) 
                        if os.path.isdir(os.path.join(category_path, d)) and not d.startswith('.')]
        
        for question_dir in question_dirs:
            question_path = os.path.join(category_path, question_dir)
            try:
                # Read question details
                with open(os.path.join(question_path, "Question.txt"), "r") as f:
                    description = f.read()
                
                with open(os.path.join(question_path, "rubric.txt"), "r") as f:
                    rubric = f.read()
                
                with open(os.path.join(question_path, "Solution.java"), "r") as f:
                    model_solution = f.read()
                
                # Determine difficulty based on category or content
                # For now, we'll use a simple heuristic
                difficulty = "Medium"  # Default
                if "Easy" in question_dir or "Basic" in question_dir:
                    difficulty = "Easy"
                elif "Hard" in question_dir or "Advanced" in question_dir:
                    difficulty = "Hard"
                
                # Create question object
                question = {
                    "id": f"{category}/{question_dir}",
                    "title": question_dir.replace("-", " "),
                    "description": description,
                    "difficulty": difficulty,
                    "category": category,
                    "requirements": [],  # Extract from description if needed
                    "testCases": ["test1"],  # Add actual test cases
                    "rubric": rubric,
                    "modelSolution": model_solution
                }
                
                questions.append(question)
                
            except Exception as e:
                logger.error(f"Error loading question {question_dir}: {str(e)}")
                continue
    
    return questions

@app.get("/questions/{category}/{title}")
async def get_question(category: str, title: str):
    """Get a specific question by category and title"""
    try:
        # Decode the title from URL format
        decoded_title = title.replace("%20", " ")
        question_path = os.path.join("DSA Dataset", category, decoded_title)
        
        if not os.path.exists(question_path):
            # Try with different variations of the title
            variations = [
                decoded_title,
                decoded_title.replace(" ", "-"),
                decoded_title.replace("-", " ")
            ]
            
            for variation in variations:
                alt_path = os.path.join("DSA Dataset", category, variation)
                if os.path.exists(alt_path):
                    question_path = alt_path
                    decoded_title = variation
                    break
            else:
                raise HTTPException(status_code=404, detail="Question not found")
        
        # Read question details
        with open(os.path.join(question_path, "Question.txt"), "r") as f:
            description = f.read()
        
        with open(os.path.join(question_path, "rubric.txt"), "r") as f:
            rubric = f.read()
        
        with open(os.path.join(question_path, "Solution.java"), "r") as f:
            model_solution = f.read()
        
        # Determine difficulty based on category or content
        difficulty = "Medium"  # Default
        if "Easy" in decoded_title or "Basic" in decoded_title:
            difficulty = "Easy"
        elif "Hard" in decoded_title or "Advanced" in decoded_title:
            difficulty = "Hard"
        
        # Create the question object
        question = {
            "id": f"{category}/{decoded_title}",
            "title": decoded_title,
            "description": description,
            "difficulty": difficulty,
            "category": category,
            "requirements": [],  # You can add requirements parsing if needed
            "testCases": [],  # You can add test cases parsing if needed
            "rubric": rubric.split("\n"),  # Split into array of strings
            "modelSolution": model_solution
        }
        
        return question
    except Exception as e:
        logger.error(f"Error getting question: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=APP_HOST, port=APP_PORT, reload=DEBUG_MODE)