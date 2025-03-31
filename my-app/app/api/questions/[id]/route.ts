import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const API_URL = "https://codeevaluator.onrender.com/api";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      console.log("[Questions API] No access token found in cookie");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const questionId = decodeURIComponent(params.id);
    console.log("Received request for question ID:", questionId);

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    // Get the problem details
    const response = await axios.get(
      `${API_URL}/evaluation/problem/${questionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.data) {
      return NextResponse.json(
        { error: "Invalid response format from server" },
        { status: 500 }
      );
    }

    const problem = response.data;
    console.log("Raw problem data:", problem);

    // Create a default rubric based on the problem
    const defaultRubric = `Evaluation Criteria:

Solution 1: Binary Search Implementation
1. Correct initialization of pointers [1 mark]
2. Proper loop termination condition [1 mark]
3. Correct handling of first occurrence [2 marks]
4. Proper range adjustment [2 marks]
5. Correct return value handling [1 mark]

Solution 2: Linear Search Implementation
1. Correct array traversal [1 mark]
2. Proper handling of first occurrence [1 mark]
3. Correct return value handling [1 mark]
4. Edge case handling [1 mark]
5. Input validation [1 mark]`;

    // Transform the problem data to match frontend expectations
    const question = {
      id: problem.problem_id.toString(),
      title: problem.title || "Untitled Problem",
      description:
        problem.problem_description || problem.description || problem.title,
      difficulty: problem.difficulty_level || "Medium",
      category: problem.topic || "Uncategorized",
      requirements: problem.requirements || [],
      testCases: problem.test_cases || [],
      rubric: problem.rubric || defaultRubric,
      modelSolution: problem.model_solution || "",
    };

    console.log("Transformed question:", question);
    return NextResponse.json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.response?.status === 404) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.response?.data?.detail || "Failed to fetch question" },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
