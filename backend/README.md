# Rubric-Based Code Evaluation System

## Overview
This system evaluates student code submissions against instructor-defined rubrics using Large Language Models (LLMs). It analyzes code, determines if rubric criteria are met, calculates scores, and generates detailed feedback.

## Core Functionality
- Parse and process structured rubrics with defined criteria and point values
- Evaluate code based on logical correctness rather than syntax
- Provide specific, actionable feedback for each rubric criterion
- Generate consistent, fair assessments comparable to human grading
- Support binary grading (full points or zero) for each criterion

## System Flow

### 1. Initial Request Handling
The system receives an evaluation request through the `/evaluate` endpoint in `app.py`. The request contains:
- Problem statement
- Assessment rubric
- Student code submission

### 2. Main Evaluation Process
The `evaluate_submission()` function in `evaluator.py` orchestrates the evaluation process:

#### Input Processing
- Inputs are sanitized and validated for security purposes
- `process_inputs()` in `sanitizer.py` processes all inputs

#### Rubric Extraction
The `RubricExtractorAgent` handles rubric analysis:
- Parses the structured rubric format using `parse_rubric()` in `rubric_parser.py`
- Evaluates multiple approaches in parallel to determine which matches the student's solution
- Selects the best matching approach with the highest confidence score
- Returns the formatted rubric for evaluation

#### Code Approach Explanation
The `ApproachExplanationAgent` analyzes the student's code:
- Provides a step-by-step explanation of how the code works
- Identifies algorithm details and implementation patterns
- Analyzes time and space complexity
- Identifies any issues without suggesting fixes

#### Evaluation Guidance Generation
The `EvaluationGuidanceAgent` generates specialized guidance:
- Creates algorithm-specific evaluation guidelines
- Lists key implementation patterns to look for
- Identifies common errors and misleading patterns
- Provides test cases for verification

#### Prompt Construction
`llm_client.py` constructs a comprehensive evaluation prompt with:
- Problem statement
- Selected rubric approach
- Student code
- Algorithm-specific guidance
- Approach explanation

#### LLM Evaluation
- The constructed prompt is sent to the LLM through `query_llm()` in `llm_utils.py`
- The LLM processes the prompt and returns a detailed evaluation

#### Response Parsing
The LLM response is parsed into a structured format:
- Extracts scores for each rubric point
- Collects justifications and feedback
- Calculates the total score

### 3. Response Generation
The system returns a structured `EvaluationResponse` with:
- Total score
- Maximum possible score
- Detailed feedback for each rubric point
- Any errors encountered

## Key Components

### API Layer (`app.py`)
- Handles HTTP requests and responses
- Defines endpoints and request/response models
- Manages error handling and logging

### Evaluator (`evaluator.py`)
- Coordinates the entire evaluation process
- Calls the appropriate agents and utilities
- Processes responses and generates the final evaluation

### Agents
- `RubricExtractorAgent`: Identifies the appropriate rubric approach
- `ApproachExplanationAgent`: Analyzes and explains the student's code
- `EvaluationGuidanceAgent`: Generates algorithm-specific guidance

### LLM Integration
- `llm_client.py`: Constructs prompts and parses responses
- `llm_utils.py`: Manages LLM interactions and error handling

### Utilities
- `rubric_parser.py`: Parses rubric structure
- `sanitizer.py`: Processes and secures inputs
- `security.py`: Implements security measures
- `models/`: Defines data models for requests and responses

## Input Requirements

### Problem Statement
A clear description of the programming problem to be solved.

### Rubric
A structured assessment rubric with defined criteria and point values. Example format:
```
Solution 1: Approach Name
1. Criterion description [X marks]
2. Another criterion [Y marks]
...

Solution 2: Another Approach Name
1. Different criterion [Z marks]
...
```

### Student Code
The student's code submission to be evaluated.

## Output Format
The system returns a JSON response with:
```json
{
  "score": 5,
  "max_score": 7,
  "feedback": {
    "1": {
      "points_awarded": 1,
      "max_points": 1,
      "feedback": "Detailed feedback for this point"
    },
    "2": { ... },
    ...
  },
  "error": null
}
```

## Usage
Send a POST request to the `/evaluate` endpoint with the required inputs to receive an evaluation response.

## Evaluation Methodologies
The system supports multiple evaluation approaches:
- Complete Rubric Evaluation (CRE): Holistic assessment in one pass
- Pointwise Rubric Evaluation (PRE): Criterion-by-criterion assessment
- Ensembling Method Evaluation (EME): Aggregating multiple model evaluations




# Frontend Integration Guide

This guide explains how to integrate the LLM Code Evaluator API with your frontend application.

## API Endpoint Overview

Your backend exposes the following endpoints for frontend integration:

1. **Submit Code for Evaluation**:
   ```
   POST /api/submissions
   ```

2. **Check Submission Status**:
   ```
   GET /api/submissions/{submission_id}/status
   ```

3. **Get Evaluation Results**:
   ```
   GET /api/submissions/{submission_id}/results
   ```

## Integration Steps

### 1. Submit Button Click Handler

```javascript
async function handleSubmit() {
  const editorCode = getCodeFromEditor(); // Get code from your editor component
  const problemStatement = getProblemStatement(); // Get from your UI or props
  const rubric = getRubric(); // Get from your UI or props

  try {
    const response = await fetch('http://your-backend-url/api/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem_statement: problemStatement,
        rubric: rubric,
        student_code: editorCode,
        language: 'java' // Or detect from your UI
      }),
    });

    const data = await response.json();
    
    // Store the submission_id for later use
    const submissionId = data.submission_id;
    
    // You can either poll for status or show a message asking user to check results later
    startPollingStatus(submissionId); // Optional - implement polling
    
    // Show success notification
    showNotification('Code submitted successfully! Check results in a moment.');
  } catch (error) {
    console.error('Error submitting code:', error);
    showNotification('Error submitting code. Please try again.');
  }
}
```

### 2. Results Button Click Handler

```javascript
async function handleViewResults(submissionId) {
  try {
    const response = await fetch(`http://your-backend-url/api/submissions/${submissionId}/results`);
    const data = await response.json();
    
    if (data.status === 'processing') {
      showNotification('Evaluation is still in progress. Please check back later.');
      return;
    }
    
    if (data.status === 'failed') {
      showNotification(`Evaluation failed: ${data.error}`);
      return;
    }
    
    // Display the results in your UI
    displayResults(data);
  } catch (error) {
    console.error('Error fetching results:', error);
    showNotification('Error fetching results. Please try again.');
  }
}
```

### 3. Optional: Status Polling Function

```javascript
function startPollingStatus(submissionId) {
  const pollingInterval = 2000; // Poll every 2 seconds
  const maxPolls = 30; // Poll for max 1 minute (30 * 2 seconds)
  let pollCount = 0;
  
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`http://your-backend-url/api/submissions/${submissionId}/status`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        clearInterval(pollInterval);
        showNotification('Evaluation completed! Click "Results" to view.');
        // Optionally fetch results immediately
        handleViewResults(submissionId);
      } else if (data.status === 'failed') {
        clearInterval(pollInterval);
        showNotification(`Evaluation failed: ${data.error}`);
      }
      
      pollCount++;
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        showNotification('Evaluation is taking longer than expected. Check results later.');
      }
    } catch (error) {
      console.error('Error polling status:', error);
      clearInterval(pollInterval);
    }
  }, pollingInterval);
}
```

### 4. Results Display Component

Create a component to display the evaluation results in a user-friendly way:

```jsx
function EvaluationResults({ results }) {
  if (!results) return <div>No results available</div>;
  
  return (
    <div className="evaluation-results">
      <h2>Evaluation Results</h2>
      <div className="score-summary">
        <h3>Score: {results.score} / {results.max_score}</h3>
      </div>
      
      <div className="feedback-details">
        <h3>Detailed Feedback</h3>
        {Object.entries(results.feedback).map(([pointId, item]) => (
          <div key={pointId} className="feedback-item">
            <h4>Criterion {pointId}</h4>
            <p>Points: {item.points_awarded} / {item.max_points}</p>
            <p>{item.feedback}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Testing Your Integration

1. Start your backend server
2. Implement the frontend code
3. Make a test submission
4. Verify the results are displayed correctly

## Error Handling

- Always handle network errors
- Implement timeouts for long-running evaluations
- Provide clear feedback to users about submission status
- Consider adding retry logic for failed API calls