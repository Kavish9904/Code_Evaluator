import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, questionId, category, title } = body;

    if (!code || !category || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Call the backend evaluation endpoint
    const response = await fetch("http://localhost:8000/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        problem_statement: title,
        rubric: body.rubric || "", // We need to pass the rubric from the question
        student_code: code,
        model_solution: body.modelSolution || "", // We need to pass the model solution
        language: "java", // Default to Java for now
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to evaluate code");
    }

    const data = await response.json();
    return NextResponse.json({
      score: data.score || 0,
      feedback: data.feedback || "No feedback available",
      details: data.details || {},
    });
  } catch (error) {
    console.error("Error evaluating code:", error);
    return NextResponse.json(
      { error: "Failed to evaluate code" },
      { status: 500 }
    );
  }
}
