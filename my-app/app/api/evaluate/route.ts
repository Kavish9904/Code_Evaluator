import { NextResponse } from "next/server";
import OpenAI from "openai";

// Add debug logging
console.log("API Route Loading");
console.log("Environment variable present:", !!process.env.OPENAI_API_KEY);

// Initialize OpenAI client
let openai: OpenAI;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not defined in environment variables");
  }

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error("Error initializing OpenAI client:", error);
  throw error;
}

async function checkLogicalEquivalence(
  actual: string,
  expected: string
): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a precise evaluator comparing two responses. Your task is to determine if the actual output satisfies the requirements of the expected output.

Rules for evaluation:
1. Core Requirements:
   - ALL key points/requirements from the expected output must be present in the actual output
   - The order of points or information doesn't matter
   - Different phrasing or formatting is acceptable
   - Additional information in the actual output is fine as long as it doesn't contradict the expected output

2. Comparison Guidelines:
   - Focus on meaning and intent, not exact wording
   - Ignore formatting differences (markdown, bullets, numbering, etc.)
   - Consider responses equivalent if they convey the same key information
   - Additional details, examples, or explanations don't invalidate a match

You must respond with ONLY:
'true' - if the actual output includes ALL required information from the expected output
'false' - if ANY required information is missing or contradicted`,
        },
        {
          role: "user",
          content: `Compare these outputs:

Expected Output:
${expected}

Actual Output:
${actual}

Does the actual output contain all required information from the expected output? Respond with only 'true' or 'false'.`,
        },
      ],
      temperature: 0,
    });

    return response.choices[0].message.content?.toLowerCase().trim() === "true";
  } catch (error) {
    console.error("Error checking logical equivalence:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!openai) {
      return NextResponse.json({
        output: "",
        passed: false,
        error: null,
      });
    }

    const body = await request.json();
    const { prompt, testCase } = body;

    if (!prompt || !testCase) {
      return NextResponse.json({
        output: "",
        passed: false,
        error: null,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: testCase.input,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const output = completion.choices[0].message.content || "";
    const passed = await checkLogicalEquivalence(
      output,
      testCase.expectedOutput
    );

    return NextResponse.json({
      output,
      passed,
      error: null,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({
      output: "",
      passed: false,
      error: null,
    });
  }
}
