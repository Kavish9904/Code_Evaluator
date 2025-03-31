import { NextResponse } from "next/server";
import { evaluationService } from "../../../../../services/evaluationService";

export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  try {
    const problems = await evaluationService.getProblems();

    // Filter problems by category
    const categoryProblems = problems.filter(
      (problem) =>
        problem.category.toLowerCase() === params.category.toLowerCase()
    );

    // Transform the data to match frontend expectations
    const questions = categoryProblems.map((problem) => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty_level || "Medium",
      category: problem.category,
    }));

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions by category:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch questions",
      },
      { status: 500 }
    );
  }
}
