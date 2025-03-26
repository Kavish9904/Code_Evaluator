import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  requirements: string[];
  testCases: string[];
  rubric: string;
  modelSolution: string;
}

export async function GET() {
  try {
    // During build time, return empty array
    if (
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PHASE === "build"
    ) {
      return NextResponse.json([]);
    }

    // Forward the request to the backend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/questions`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || "Failed to fetch questions" },
        { status: response.status }
      );
    }

    const questions = await response.json();
    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
