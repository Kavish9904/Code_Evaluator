import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Simplified query - just get all submissions for this question
    const submissionsRef = collection(db, "submissions");
    const q = query(
      submissionsRef,
      where("questionId", "==", Number(data.questionId))
    );

    const querySnapshot = await getDocs(q);
    const submissionNumber = querySnapshot.size + 1; // Simply count existing submissions + 1

    const submissionData = {
      questionId: Number(data.questionId),
      promptText: String(data.prompt).slice(0, 1500),
      passed: Boolean(data.passed),
      timestamp: new Date().toISOString(),
      testCaseInput: String(data.testCase.input).slice(0, 500),
      testCaseOutput: String(data.testCase.expectedOutput).slice(0, 500),
      submissionNumber: submissionNumber,
      rating: calculateRating(data.prompt, data.testCase),
    };

    const docRef = await addDoc(submissionsRef, submissionData);

    return NextResponse.json({
      success: true,
      message: "Submitted successfully!",
      submissionId: docRef.id,
      submissionNumber: submissionNumber,
      rating: submissionData.rating,
    });
  } catch (error) {
    console.error("Error storing submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to store submission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function calculateRating(prompt: string, testCase: unknown): number {
  let rating = 70; // Base rating

  // Factor 1: Length optimization (shorter prompts are generally better)
  const lengthScore = Math.max(0, 10 - prompt.length / 100);
  rating += lengthScore;

  // Factor 2: Clarity (based on readability)
  const hasGoodStructure = prompt.includes("\n") && prompt.includes(":");
  rating += hasGoodStructure ? 5 : 0;

  // Factor 3: Completeness
  const hasAllParts =
    prompt.toLowerCase().includes("if") &&
    prompt.toLowerCase().includes("then") &&
    prompt.includes(".");
  rating += hasAllParts ? 5 : 0;

  // Factor 4: Specificity
  const isSpecific =
    prompt.includes('"') ||
    prompt.includes("example") ||
    prompt.includes("specific");
  rating += isSpecific ? 5 : 0;

  // Factor 5: Error handling
  const hasErrorHandling =
    prompt.toLowerCase().includes("error") ||
    prompt.toLowerCase().includes("invalid") ||
    prompt.toLowerCase().includes("handle");
  rating += hasErrorHandling ? 5 : 0;

  // Ensure rating stays within 0-100
  return Math.min(100, Math.max(0, Math.round(rating)));
}
