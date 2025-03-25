import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { category: string; title: string } }
) {
  try {
    const { category, title } = params;

    // Forward the request to the backend API
    const response = await fetch(
      `http://localhost:8000/questions/${category}/${title}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || "Failed to fetch question" },
        { status: response.status }
      );
    }

    const question = await response.json();
    return NextResponse.json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
