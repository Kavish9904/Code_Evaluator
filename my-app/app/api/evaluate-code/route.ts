import { NextResponse } from "next/server";

interface ProblemConfig {
  functionName: string;
  inputFormat: string;
  outputFormat: string;
}

const PROBLEM_CONFIGS: { [key: number]: ProblemConfig } = {
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

const LANGUAGE_TEMPLATES = {
  javascript: {
    wrapCode: (code: string, problemId: number, input: any) => {
      const config = PROBLEM_CONFIGS[problemId];
      const functionCall =
        config.functionName + getInputParams(config.inputFormat, input);
      return `
        ${code}
        return ${functionCall};
      `;
    },
  },
  python: {
    wrapCode: (code: string, problemId: number, input: any) => {
      const config = PROBLEM_CONFIGS[problemId];
      const functionCall =
        config.functionName + getPythonInputParams(config.inputFormat, input);
      return `
def run_test(input):
    ${code.replace(/^/gm, "    ")}
    return ${functionCall}
result = run_test(input)
      `;
    },
  },
  java: {
    wrapCode: (code: string, problemId: number, input: any) => {
      const config = PROBLEM_CONFIGS[problemId];
      const params = getJavaInputParams(config.inputFormat, input);
      return `
public class Solution {
    ${code.replace(/^/gm, "    ")}
    
    public static void main(String[] args) {
        Solution solution = new Solution();
        ${params.declarations}
        System.out.println(solution.${config.functionName}(${
        params.arguments
      }));
    }
}
      `;
    },
  },
  cpp: {
    wrapCode: (code: string, problemId: number, input: any) => {
      const config = PROBLEM_CONFIGS[problemId];
      const params = getCppInputParams(config.inputFormat, input);
      return `
#include <vector>
#include <iostream>
#include <iomanip>
using namespace std;

${code}

int main() {
    ${params.declarations}
    ${code.includes("class Solution") ? "Solution solution;\n    " : ""}
    ${getCppOutputStatement(
      config.outputFormat,
      config.functionName,
      params.arguments
    )}
    return 0;
}`;
    },
  },
  ruby: {
    wrapCode: (code: string, problemId: number, input: any) => {
      const config = PROBLEM_CONFIGS[problemId];
      const functionCall =
        config.functionName + getRubyInputParams(config.inputFormat, input);
      return `
${code}
return ${functionCall}
      `;
    },
  },
};

function getInputParams(format: string, input: any): string {
  switch (format) {
    case "array,number":
      return `(input.nums, input.target)`;
    case "string":
      return `(input)`;
    case "array,array":
      return `(input.nums1, input.nums2)`;
    default:
      return "(input)";
  }
}

function getPythonInputParams(format: string, input: any): string {
  switch (format) {
    case "array,number":
      return `(input['nums'], input['target'])`;
    case "string":
      return `(input)`;
    case "array,array":
      return `(input['nums1'], input['nums2'])`;
    default:
      return "(input)";
  }
}

function getJavaInputParams(
  format: string,
  input: any
): { declarations: string; arguments: string } {
  switch (format) {
    case "array,number":
      return {
        declarations: `
        int[] nums = new int[]{${input.nums.join(",")}};
        int target = ${input.target};`,
        arguments: "nums, target",
      };
    case "string":
      return {
        declarations: `String input = "${input}";`,
        arguments: "input",
      };
    case "array,array":
      return {
        declarations: `
        int[] nums1 = new int[]{${input.nums1.join(",")}};
        int[] nums2 = new int[]{${input.nums2.join(",")}};`,
        arguments: "nums1, nums2",
      };
    default:
      return { declarations: "", arguments: "" };
  }
}

function getCppInputParams(
  format: string,
  input: any
): { declarations: string; arguments: string } {
  switch (format) {
    case "array,number":
      return {
        declarations: `
        vector<int> nums = {${input.nums.join(",")}};
        int target = ${input.target};`,
        arguments: "nums, target",
      };
    case "string":
      return {
        declarations: `string input = "${input}";`,
        arguments: "input",
      };
    case "array,array":
      return {
        declarations: `
        vector<int> nums1 = {${input.nums1.join(",")}};
        vector<int> nums2 = {${input.nums2.join(",")}};`,
        arguments: "nums1, nums2",
      };
    default:
      return { declarations: "", arguments: "" };
  }
}

function getRubyInputParams(format: string, input: any): string {
  switch (format) {
    case "array,number":
      return `(input['nums'], input['target'])`;
    case "string":
      return `(input)`;
    case "array,array":
      return `(input['nums1'], input['nums2'])`;
    default:
      return "(input)";
  }
}

function getCppOutputStatement(
  format: string,
  functionName: string,
  args: string
): string {
  switch (format) {
    case "array":
      return `
    vector<int> result = solution.${functionName}(${args});
    cout << "[" << result[0] << "," << result[1] << "]";`;
    case "string":
      return `cout << solution.${functionName}(${args});`;
    case "number":
      return `cout << fixed << setprecision(1) << solution.${functionName}(${args});`;
    default:
      return `cout << solution.${functionName}(${args});`;
  }
}

function formatOutput(output: any, format: string): string {
  switch (format) {
    case "array":
      return JSON.stringify(output);
    case "number":
      return output.toFixed(1);
    default:
      return String(output);
  }
}

function validateSolution(
  code: string,
  language: string,
  problemId: number
): string | null {
  // Check if the code contains the required function/class
  const config = PROBLEM_CONFIGS[problemId];

  if (!code.includes(config.functionName)) {
    return `Missing required function: ${config.functionName}`;
  }

  // Language-specific validations
  switch (language) {
    case "cpp":
      if (problemId !== 2 && !code.includes("class Solution")) {
        return "C++ solution must be wrapped in a Solution class";
      }
      break;
    case "java":
      if (!code.includes("public class Solution")) {
        return "Java solution must be in a Solution class";
      }
      break;
    case "python":
      if (!code.includes("def " + config.functionName)) {
        return `Python solution must define the ${config.functionName} function`;
      }
      break;
    case "javascript":
      if (!code.includes("function " + config.functionName)) {
        return `JavaScript solution must define the ${config.functionName} function`;
      }
      break;
    case "ruby":
      if (!code.includes("def " + config.functionName)) {
        return `Ruby solution must define the ${config.functionName} method`;
      }
      break;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { code, testCase } = await req.json();

    if (!code || !testCase) {
      return NextResponse.json(
        { error: "Code and test case are required" },
        { status: 400 }
      );
    }

    // Parse the input string into actual values
    let input;
    try {
      if (testCase.id === 1) {
        // Two Sum
        const [numsStr, targetStr] = testCase.input.split(", ");
        const nums = JSON.parse(numsStr);
        const target = parseInt(targetStr);
        input = { nums, target };
      } else if (testCase.id === 2) {
        // Longest Palindrome - input is already a string
        input = testCase.input.replace(/^"(.*)"$/, "$1"); // Remove quotes if present
      } else if (testCase.id === 3) {
        // Median of Two Sorted Arrays
        const [arr1Str, arr2Str] = testCase.input.split(", ");
        const nums1 = JSON.parse(arr1Str);
        const nums2 = JSON.parse(arr2Str);
        input = { nums1, nums2 };
      }
    } catch (error) {
      console.error("Input parsing error:", error);
      return NextResponse.json(
        { error: "Invalid test case input format" },
        { status: 400 }
      );
    }

    try {
      let output;

      if (testCase.id === 2) {
        // For Longest Palindrome
        const userFunction = new Function(
          "s",
          `
          ${code}
          return longestPalindrome(s);
          `
        );
        output = userFunction(input);
      } else if (testCase.id === 3) {
        // For Median of Two Sorted Arrays
        const userFunction = new Function(
          "nums1",
          "nums2",
          `
          ${code}
          return findMedianSortedArrays(nums1, nums2);
          `
        );
        output = Number(userFunction(input.nums1, input.nums2)).toFixed(1);
      } else {
        // For Two Sum
        const userFunction = new Function(
          "nums",
          "target",
          `
          ${code}
          return twoSum(nums, target);
          `
        );
        output = JSON.stringify(userFunction(input.nums, input.target));
      }

      // Compare with expected output
      const passed = output === testCase.expectedOutput;

      return NextResponse.json({
        passed,
        output,
        expectedOutput: testCase.expectedOutput,
      });
    } catch (e) {
      console.error("Code execution error:", e);
      return NextResponse.json({
        passed: false,
        output: null,
        error: e instanceof Error ? e.message : "Runtime error occurred",
      });
    }
  } catch (error) {
    console.error("General error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate code" },
      { status: 500 }
    );
  }
}
