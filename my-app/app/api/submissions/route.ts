import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

interface Submission {
  code: string;
  questionId: string;
  studentScore: number;
  username: string;
  timestamp: string;
  aiScore: number;
  feedback: string;
  questionDifficulty?: string;
  absoluteDifference?: number;
  maxScore?: number;
  rank?: number;
  accuracy?: number;
  uniqueQuestions?: number;
  status?: string;
  submissionId?: string;
}

const API_URL = "https://codeevaluator.onrender.com/api";
const SUBMISSIONS_FILE = path.join(process.cwd(), "submissions.json");
const MAX_POLLING_ATTEMPTS = 30; // Increased from 10 to 30
const INITIAL_POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_INTERVAL = 10000; // 10 seconds

// Helper function to load submissions from file
function loadSubmissions(): Submission[] {
  try {
    if (!fs.existsSync(SUBMISSIONS_FILE)) {
      fs.writeFileSync(SUBMISSIONS_FILE, "[]", "utf-8");
      return [];
    }
    const data = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading submissions:", error);
    return [];
  }
}

// Helper function to save submissions to file
function saveSubmissions(submissions: Submission[]): void {
  try {
    // Validate submissions before saving
    const validSubmissions = submissions.filter((sub) => {
      const isValid =
        typeof sub.code === "string" &&
        typeof sub.questionId === "string" &&
        typeof sub.studentScore === "number" &&
        typeof sub.username === "string" &&
        typeof sub.timestamp === "string" &&
        typeof sub.aiScore === "number";

      if (!isValid) {
        console.error("Invalid submission found:", sub);
      }
      return isValid;
    });

    console.log(`Saving ${validSubmissions.length} valid submissions`); // Add logging
    fs.writeFileSync(
      SUBMISSIONS_FILE,
      JSON.stringify(validSubmissions, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Error saving submissions:", error);
  }
}

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    // Load all submissions
    const allSubmissions = loadSubmissions();
    console.log(`Loaded ${allSubmissions.length} submissions`);

    // If questionId is provided, filter submissions
    if (questionId) {
      const questionSubmissions = allSubmissions
        .filter((s) => s.questionId === questionId)
        .sort((a, b) => {
          const diffA =
            a.absoluteDifference || Math.abs(a.studentScore - a.aiScore);
          const diffB =
            b.absoluteDifference || Math.abs(b.studentScore - b.aiScore);
          return diffA - diffB;
        });

      console.log(
        `Found ${questionSubmissions.length} submissions for question ${questionId}`
      );
      return NextResponse.json(questionSubmissions);
    }

    // If no questionId, return all submissions
    return NextResponse.json(allSubmissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, questionId, studentScore } = body;

    // Get username and access token from cookies
    const cookieStore = cookies();
    const rawUsername = cookieStore.get("username")?.value;
    const accessToken = cookieStore.get("access_token")?.value;

    // Clean the username
    const username = rawUsername?.includes("@")
      ? rawUsername.split("@")[0]
      : rawUsername;

    console.log("Submission request - Username from cookie:", username);

    if (!username || !accessToken) {
      console.error("Authentication error - Missing username or access token");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!code || !questionId) {
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
      const error = await response.json();
      console.error("Evaluation error response:", error);
      throw new Error(error.detail || "Failed to evaluate submission");
    }

    const submissionResponse = await response.json();
    console.log("Submission response:", submissionResponse);

    // Poll for results
    const result = await pollForResults(
      submissionResponse.submission_id,
      accessToken
    );
    console.log("Final evaluation result:", result);

    // Create the submission object
    const submission: Submission = {
      code,
      questionId,
      studentScore: studentScore || 0,
      username,
      timestamp: new Date().toISOString(),
      aiScore: result.score || 0,
      maxScore: result.max_score || 100,
      absoluteDifference: Math.abs((studentScore || 0) - (result.score || 0)),
      questionDifficulty: "Medium", // Default to Medium since we don't fetch question details anymore
      feedback: formatFeedback(result),
      status: result.status || "completed",
      submissionId: submissionResponse.submission_id,
    };

    console.log("Created submission:", submission);

    // Load existing submissions
    const allSubmissions = loadSubmissions();

    // Add new submission
    allSubmissions.push(submission);

    // Save updated submissions
    saveSubmissions(allSubmissions);

    // Return the submission with all necessary data
    return NextResponse.json(submission);
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process submission",
      },
      { status: 500 }
    );
  }
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
