import re
from typing import Dict, List, Optional, Any, Tuple
import logging

from models.request import RubricItem, RubricPoint, StructuredRubric

logger = logging.getLogger(__name__)


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
                "id": f"{current_approach}_{point_num}",
                "description": description,
                "marks": marks
            })
    
    parsed = {
        "title": lines[0].strip(),
        "approaches": approaches
    }
    
    # Add debug logging
    logger.debug(f"Parsed rubric: {parsed}")
    return parsed


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
            
        approach = parsed_rubric["approaches"][approach_name]
        result.append(f"\n## {approach_name}: {approach['name']}")
        
        for i, point in enumerate(approach["points"]):
            result.append(f"{i+1}. {point['description']} [{point['marks']} marks]")
    
    return "\n".join(result)