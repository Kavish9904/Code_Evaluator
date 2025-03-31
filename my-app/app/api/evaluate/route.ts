import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = "https://codeevaluator.onrender.com/api";
const MAX_POLLING_ATTEMPTS = 30; // 30 attempts
const INITIAL_POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_INTERVAL = 10000; // 10 seconds

// Helper function to poll for evaluation results
async function pollForResults(
  submissionId: string,
  accessToken: string
): Promise<any> {
  let attempts = 0;
  let currentInterval = INITIAL_POLLING_INTERVAL;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    const response = await fetch(
      `${API_URL}/evaluation/status/${submissionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to check submission status");
    }

    const status = await response.json();
    console.log(`Polling attempt ${attempts + 1}:`, status);

    if (status.status === "completed") {
      // Get the final results
      const resultsResponse = await fetch(
        `${API_URL}/evaluation/results/${submissionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!resultsResponse.ok) {
        throw new Error("Failed to fetch submission results");
      }

      return await resultsResponse.json();
    }

    if (status.status === "error") {
      throw new Error(status.message || "Evaluation failed");
    }

    // Exponential backoff with maximum interval
    currentInterval = Math.min(currentInterval * 1.5, MAX_POLLING_INTERVAL);
    await new Promise((resolve) => setTimeout(resolve, currentInterval));
    attempts++;
  }

  // Instead of throwing an error, return a processing status
  return {
    status: "processing",
    submission_id: submissionId,
    message: "Evaluation is still in progress. Please check back later.",
  };
}

// Helper function to format feedback from evaluation results
function formatFeedback(result: any): string {
  if (!result) return "No feedback available";

  // If feedback is already a string, return it
  if (typeof result.feedback === "string") {
    return result.feedback;
  }

  // If feedback is an object with detailed feedback
  if (result.feedback && typeof result.feedback === "object") {
    const feedbackItems = Object.entries(result.feedback).map(
      ([key, value]: [string, any]) => {
        return `Criterion ${key}:\nPoints: ${value.points_awarded}/${value.max_points}\n${value.feedback}\n`;
      }
    );

    return feedbackItems.join("\n");
  }

  // If there's a message in the result
  if (result.message) {
    return result.message;
  }

  // If there's a status message
  if (result.status === "processing") {
    return "Evaluation is still in progress. Please check back later.";
  }

  return "No feedback available";
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { code, questionId, category, title } = body;

    if (!code || !category || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Submit code for evaluation
    const response = await fetch(`${API_URL}/evaluation/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        problem_id: questionId,
        code: code,
        language: "java", // Default to Java for now
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to evaluate code");
    }

    const submissionResponse = await response.json();
    console.log("Submission response:", submissionResponse);

    // Poll for results
    const result = await pollForResults(
      submissionResponse.submission_id,
      accessToken
    );
    console.log("Final evaluation result:", result);

    // Format the feedback
    const formattedFeedback = formatFeedback(result);

    return NextResponse.json({
      submission_id: result.submission_id || submissionResponse.submission_id,
      score: result.score || 0,
      feedback: formattedFeedback,
      details: result.details || {},
      status: result.status || "completed",
    });
  } catch (error) {
    console.error("Error evaluating code:", error);
    return NextResponse.json(
      { error: "Failed to evaluate code" },
      { status: 500 }
    );
  }
}
