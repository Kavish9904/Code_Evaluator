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
}

const BACKEND_URL = "http://localhost:8000";
const SUBMISSIONS_FILE = path.join(process.cwd(), "submissions.json");

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
    fs.writeFileSync(
      SUBMISSIONS_FILE,
      JSON.stringify(submissions, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Error saving submissions:", error);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    // Load all submissions
    const allSubmissions = loadSubmissions();

    // If questionId is provided, filter submissions
    if (questionId) {
      const questionSubmissions = allSubmissions
        .filter((s) => s.questionId === questionId)
        .sort((a, b) => {
          const diffA = Math.abs(a.studentScore - a.aiScore);
          const diffB = Math.abs(b.studentScore - b.aiScore);
          return diffA - diffB;
        });
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

    // Get username from cookies
    const cookieStore = cookies();
    const username = cookieStore.get("username")?.value;

    if (!username) {
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

    // Get the question details first
    const questionResponse = await fetch(
      `${BACKEND_URL}/questions/${encodeURIComponent(questionId)}`
    );
    if (!questionResponse.ok) {
      throw new Error("Failed to fetch question details");
    }
    const questionData = await questionResponse.json();

    // Make the evaluation request to the backend
    const response = await fetch(`${BACKEND_URL}/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problem_statement: questionData.description || "",
        rubric: Array.isArray(questionData.rubric)
          ? questionData.rubric.join("\n")
          : questionData.rubric || "",
        student_code: code,
        model_solution: questionData.modelSolution || "",
        language: "python",
        problem_dir:
          questionData.category && questionData.title
            ? `DSA Dataset/${questionData.category}/${questionData.title}`
            : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Evaluation error response:", error);
      throw new Error(error.detail || "Failed to evaluate submission");
    }

    const result = await response.json();

    // Create the submission object with the username from cookies
    const submission: Submission = {
      code,
      questionId,
      studentScore,
      username, // Use username from cookies
      timestamp: new Date().toISOString(),
      aiScore: result.ai_score || 0,
      feedback:
        typeof result.feedback === "object"
          ? Object.entries(result.feedback)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n")
          : result.feedback || "No feedback available",
    };

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
