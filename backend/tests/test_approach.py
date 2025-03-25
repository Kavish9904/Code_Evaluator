import asyncio
import sys
import os
import json
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from approach_explanation_agent import ApproachExplanationAgent

async def test_approach_explanation():
    """
    Test the ApproachExplanationAgent on sample code
    """
    # Sample problem statement
    problem_statement = """
    First and Last Occurrences
    Given a sorted array arr with possibly some duplicates, the task is to find the first and last occurrences of an element x in the given array.
    Note: If the number x is not found in the array then return both the indices as -1.
    """
    
    # Sample code to analyze
    code = """
    // User function Template for Java
    class Solution {
        ArrayList<Integer> find(int arr[], int x) {
            int low=0;
            int res1=-1;
            int res2=-1;
            int high=arr.length-1;
            while(low<=high){
                int mid=(low+high)/2;
                if(arr[mid]==x){
                    res1=mid;
                    high=mid-1;
                }
                else if(x<arr[mid]){
                    high=mid-1;
                }
                else{
                    low=mid+1;
                }
            }
            low=0;
            high=arr.length-1;
            while(low<=high){
                int mid=(low+high)/2;
                if(arr[mid]==x){
                    res2=mid;
                    low=mid+1;
                }
                else if(x<arr[mid]){
                    high=mid-1;
                }
                else{
                    low=mid+1;
                }
            }
            ArrayList<Integer> a= new ArrayList<>();
            a.add(res1);
            a.add(res2);
            return a;
        }
    }
    """
    
    # Create agent and get explanation
    agent = ApproachExplanationAgent()
    result = await agent.explain_approach(code, problem_statement)
    
    # Print results
    logger.info("Approach Name: " + result.get("approach_name", "Unknown"))
    logger.info("Issues Identified: " + str(result.get("issues_identified", [])))
    logger.info("Time Complexity: " + result.get("time_complexity", "Unknown"))
    
    # Format for evaluator
    formatted = agent.format_approach_explanation_for_evaluator(result)
    logger.info("Formatted explanation for evaluator:\n" + formatted)
    
    return result

if __name__ == "__main__":
    result = asyncio.run(test_approach_explanation())
    print(json.dumps(result, indent=2))