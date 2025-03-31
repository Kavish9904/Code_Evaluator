import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const API_URL = "https://codeevaluator.onrender.com/api";

export async function GET() {
  try {
    console.log("[Questions API] Fetching problems...");

    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      console.log("[Questions API] No access token found in cookie");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("[Questions API] Found access token");

    // Get the list of problems
    const response = await axios.get(`${API_URL}/evaluation/problems`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.data || !Array.isArray(response.data)) {
      console.error("[Questions API] Invalid response format:", response.data);
      return NextResponse.json(
        { error: "Invalid response format from server" },
        { status: 500 }
      );
    }

    // Fetch full details for each problem
    const problemDetailsPromises = response.data.map(async (problem: any) => {
      try {
        const detailsResponse = await axios.get(
          `${API_URL}/evaluation/problem/${problem.problem_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        return detailsResponse.data;
      } catch (error) {
        console.error(
          `[Questions API] Error fetching details for problem ${problem.problem_id}:`,
          error
        );
        return problem; // Return basic problem data if details fetch fails
      }
    });

    const problemsWithDetails = await Promise.all(problemDetailsPromises);

    // Transform the data to match frontend expectations
    const questions = problemsWithDetails.map((problem: any) => {
      console.log("[Questions API] Raw problem data:", problem);

      // Create a default rubric based on the problem
      const defaultRubric = `Evaluation Criteria:

1. Correctness (40 points)
   - Solution produces correct output for all test cases
   - Edge cases are handled properly
   - Input validation is implemented

2. Code Quality (30 points)
   - Code is well-organized and follows best practices
   - Variable and function names are descriptive
   - Comments explain complex logic

3. Performance (30 points)
   - Time complexity is optimal for the problem
   - Space complexity is reasonable
   - No unnecessary computations or memory usage`;

      const transformedQuestion = {
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

      console.log("[Questions API] Transformed question:", transformedQuestion);
      return transformedQuestion;
    });

    // Filter out any questions that don't have an ID
    const validQuestions = questions.filter((q) => q.id);

    console.log(
      `[Questions API] Successfully fetched ${validQuestions.length} questions`
    );
    return NextResponse.json(validQuestions);
  } catch (error) {
    console.error("[Questions API] Error fetching questions:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Authentication failed" },
          { status: 401 }
        );
      }
      if (error.response?.status === 403) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
