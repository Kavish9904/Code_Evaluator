import { NextResponse } from "next/server";
import OpenAI from "openai";

// Add debug logging
console.log("API Route Loading");
console.log("Environment variable present:", !!process.env.OPENAI_API_KEY);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?]/g, "")
    .trim();
}

// Helper function to check format compliance
function checkFormat(text: string, expectedFormat: string): boolean {
  const formats: Record<string, RegExp> = {
    "Summary:": /^Summary:/i,
    "Priority:": /^Priority:/i,
  };

  const requiredFormat = formats[expectedFormat];
  return requiredFormat ? requiredFormat.test(text) : true;
}

export async function POST(req: Request) {
  try {
    const { prompt, testCase } = await req.json();

    // Get completion from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      max_tokens: 150,
    });

    const output = completion.choices[0]?.message?.content || "";

    // Evaluate based on semantic correctness
    const evaluationPrompt = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an evaluation assistant that checks if responses are semantically correct. Follow these guidelines:

1. Focus on meaning and key information, not exact wording
2. Check if all required elements are present
3. Allow for natural language variations
4. Accept different phrasings that convey the same meaning
5. Consider context and intent

Respond with a JSON object containing:
{
  "passed": boolean,
  "reason": "explanation of why it passed or failed, focusing on semantic correctness"
}`,
        },
        {
          role: "user",
          content: `Compare these responses semantically:

Expected Output:
${testCase.expectedOutput}

Actual Output:
${output}

Are they semantically equivalent? Consider key information, intent, and required elements rather than exact wording.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const evaluation = JSON.parse(
      evaluationPrompt.choices[0]?.message?.content || "{}"
    );

    return NextResponse.json({
      passed: evaluation.passed,
      output,
      reason: evaluation.reason,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Evaluation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
