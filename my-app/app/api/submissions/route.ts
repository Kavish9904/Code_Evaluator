import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { questions } from "../../../data/sample-questions";

export async function POST(req: Request) {
  try {
    const { code, questionId, testCase, passed, username, studentScore } =
      await req.json();

    // Validate required fields
    if (
      !code ||
      !questionId ||
      !testCase ||
      username === undefined ||
      studentScore === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get question difficulty
    const question = questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }

    // Count previous attempts for this user and question
    const submissionsRef = collection(db, "submissions");
    const attemptsQuery = query(
      submissionsRef,
      where("username", "==", username),
      where("questionId", "==", questionId)
    );
    const previousSubmissions = await getDocs(attemptsQuery);
    const attempts = previousSubmissions.size + 1;

    // Create submission document
    const submissionData = {
      code,
      questionId,
      questionDifficulty: question.difficulty,
      testCase,
      passed,
      username,
      studentScore: Number(studentScore),
      timestamp: new Date(),
      aiScore: 80, // For now, hardcoding AI score
      aiFeedback:
        "Good solution! Consider adding more comments to explain your logic.", // Placeholder feedback
      absoluteDifference: Math.abs(Number(studentScore) - 80), // Calculate difference with AI score
      attempts, // Add attempts count
    };

    // Add to Firestore
    await addDoc(submissionsRef, submissionData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }
}
