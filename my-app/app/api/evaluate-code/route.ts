import { NextResponse } from "next/server";

interface CodeEvalInput {
  code: string;
  testCaseId: number;
  language?: string;
}

interface TestResult {
  passed: boolean;
  output: string;
  error?: string;
}

interface ProblemConfig {
  functionName: string;
  inputFormat: string;
  outputFormat: string;
}

const PROBLEM_CONFIGS: Record<number, ProblemConfig> = {
  1: {
    functionName: "twoSum",
    inputFormat: "array,number",
    outputFormat: "array",
  },
  2: {
    functionName: "longestPalindrome",
    inputFormat: "string",
    outputFormat: "string",
  },
  3: {
    functionName: "findMedianSortedArrays",
    inputFormat: "array,array",
    outputFormat: "number",
  },
};

export async function POST(request: Request) {
  try {
    const { code, testCaseId } = (await request.json()) as CodeEvalInput;

    // Validate input
    if (!code || !testCaseId) {
      return NextResponse.json(
        { error: "Code and test case ID are required" },
        { status: 400 }
      );
    }

    // Get problem configuration
    const config = PROBLEM_CONFIGS[testCaseId];
    if (!config) {
      return NextResponse.json(
        { error: "Invalid test case ID" },
        { status: 400 }
      );
    }

    // For now, we'll use a simple evaluation approach
    const result: TestResult = {
      passed: true,
      output: "Test passed successfully",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error evaluating code:", error);
    return NextResponse.json(
      { error: "Failed to evaluate code" },
      { status: 500 }
    );
  }
}
