import re
import logging
from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import Problem

logger = logging.getLogger(__name__)

# Schema models for rubric parsing
class RubricPoint(BaseModel):
    id: str
    description: str
    marks: int

class RubricApproach(BaseModel):
    name: str
    points: List[RubricPoint]

class ParsedRubric(BaseModel):
    title: str
    approaches: Dict[str, RubricApproach]
    best_approach: Optional[str] = None
    total_marks: Optional[int] = None


def parse_rubric(rubric_text: str) -> Dict[str, Any]:
    """
    Parse rubric text into a structured format.
    
    Args:
        rubric_text: Raw rubric text
        
    Returns:
        Structured representation of the rubric
    """
    lines = rubric_text.strip().split('\n')
    
    # Extract title (first line)
    title = lines[0].strip()
    
    # Initialize structure
    approaches = {}
    current_approach = None
    
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        
        # Check if this is a solution approach header
        solution_match = re.match(r'Solution\s+(\d+):\s+(.*)', line)
        if solution_match:
            approach_num = solution_match.group(1)
            approach_name = solution_match.group(2)
            current_approach = f"Solution {approach_num}"
            approaches[current_approach] = {
                "name": approach_name,
                "points": []
            }
            continue
        
        # Check if this is a rubric point
        point_match = re.match(r'(\d+)\.\s+(.*)\s+\[(\d+)\s+mark(?:s)?\]', line)
        if point_match and current_approach:
            point_num = point_match.group(1)
            description = point_match.group(2)
            marks = int(point_match.group(3))
            
            approaches[current_approach]["points"].append({
                "id": point_num,
                "description": description,
                "marks": marks
            })
    
    parsed = {
        "title": title,
        "approaches": approaches
    }
    
    # Add debug logging
    logger.debug(f"Parsed rubric: {parsed}")
    return parsed


def get_rubric_from_problem(db: Session, problem_id: int) -> Optional[Dict[str, Any]]:
    """
    Get and parse rubric from a problem in the database
    
    Args:
        db: Database session
        problem_id: ID of the problem
        
    Returns:
        Parsed rubric or None if problem not found
    """
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        return None
    
    return parse_rubric(problem.rubric)


def get_total_marks(parsed_rubric: Dict[str, Any]) -> int:
    """
    Calculate the total marks available in the rubric
    
    Args:
        parsed_rubric: Structured rubric object
        
    Returns:
        Total marks
    """
    total = 0
    for approach in parsed_rubric["approaches"].values():
        for point in approach["points"]:
            total += point["marks"]
    return total


def get_approach_marks(parsed_rubric: Dict[str, Any], approach: str) -> int:
    """
    Calculate the total marks available for a specific approach
    
    Args:
        parsed_rubric: Structured rubric object
        approach: The approach name
        
    Returns:
        Total marks for the approach
    """
    if approach not in parsed_rubric["approaches"]:
        return 0
        
    return sum(point["marks"] for point in parsed_rubric["approaches"][approach]["points"])


def identify_best_approach(parsed_rubric: Dict[str, Any]) -> str:
    """
    Identify the approach with the highest potential points
    
    Args:
        parsed_rubric: Structured rubric object
        
    Returns:
        The name of the approach with highest marks
    """
    best_approach = None
    max_marks = 0
    
    for approach_name, approach in parsed_rubric["approaches"].items():
        approach_marks = sum(point["marks"] for point in approach["points"])
        if approach_marks > max_marks:
            max_marks = approach_marks
            best_approach = approach_name
    
    return best_approach


def format_rubric_for_llm(parsed_rubric: Dict[str, Any], approach: Optional[str] = None) -> str:
    """
    Format the rubric for LLM consumption
    
    Args:
        parsed_rubric: Structured rubric object
        approach: Optional specific approach to format (if None, formats all)
        
    Returns:
        Formatted rubric text
    """
    result = [f"# {parsed_rubric['title']}"]
    
    approaches_to_format = [approach] if approach else parsed_rubric["approaches"].keys()
    
    for approach_name in approaches_to_format:
        if approach_name not in parsed_rubric["approaches"]:
            continue
            
        approach_data = parsed_rubric["approaches"][approach_name]
        result.append(f"\n## {approach_name}: {approach_data['name']}")
        
        for i, point in enumerate(approach_data["points"]):
            result.append(f"{i+1}. {point['description']} [{point['marks']} marks]")
    
    return "\n".join(result)


def get_complete_rubric(db: Session, problem_id: int) -> Optional[ParsedRubric]:
    """
    Get a complete rubric with best approach and total marks identified
    
    Args:
        db: Database session
        problem_id: ID of the problem
        
    Returns:
        Complete rubric with metadata or None if problem not found
    """
    parsed_rubric = get_rubric_from_problem(db, problem_id)
    if not parsed_rubric:
        return None
    
    best_approach = identify_best_approach(parsed_rubric)
    total_marks = get_total_marks(parsed_rubric)
    
    # Convert to structured model
    approaches_dict = {}
    for approach_name, approach_data in parsed_rubric["approaches"].items():
        points = [
            RubricPoint(
                id=point["id"],
                description=point["description"],
                marks=point["marks"]
            )
            for point in approach_data["points"]
        ]
        approaches_dict[approach_name] = RubricApproach(
            name=approach_data["name"],
            points=points
        )
    
    return ParsedRubric(
        title=parsed_rubric["title"],
        approaches=approaches_dict,
        best_approach=best_approach,
        total_marks=total_marks
    )