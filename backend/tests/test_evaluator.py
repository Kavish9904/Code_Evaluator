import requests
import json
import os

# Base URL of your API
base_url = "http://localhost:8000"

# Function to read file content
def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

# Path to your dataset files
base_path = "/Users/akhand/Documents/CS_Course/SOP_LLM/LLMEvaluator/LLMEvaluator/DSA Dataset/Dynamic Programming/Subset Sum Problem"
problem_file = os.path.join(base_path, "Question.txt")
rubric_file = os.path.join(base_path, "rubric.txt")
solution_file = "/Users/akhand/Documents/CS_Course/SOP_LLM/LLMEvaluator/LLMEvaluator/test_sol.java"
# Read the files
problem_statement = read_file(problem_file)
rubric = read_file(rubric_file)
student_code = read_file(solution_file)

# Test data using the files from your dataset
test_data = {
    "problem_statement": problem_statement,
    "rubric": rubric,
    "student_code": student_code,
    "language": "java"
}

# Send request to standard evaluation endpoint
print("Sending request to standard evaluation endpoint...")
response = requests.post(f"{base_url}/evaluate", json=test_data)

# Print the response
print("\nStandard Evaluation:")
print("Status code:", response.status_code)
print("Response:")
print(json.dumps(response.json(), indent=2))


# Save results to file
with open("evaluation_results.json", "w") as f:
    json.dump({
        "standard_evaluation": response.json(),
    }, f, indent=2)

print("\nResults saved to evaluation_results.json")