import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // Evaluate prompt optimization using GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI prompt optimization evaluator. Rate prompts on clarity, efficiency, and effectiveness on a scale of 0-100.",
        },
        {
          role: "user",
          content: `Evaluate this prompt and provide a score (0-100):\n\n${prompt}`,
        },
      ],
    });

    const score = parseInt(completion.choices[0].message.content || "0");

    return NextResponse.json({ score });
  } catch (error) {
    console.error("Error evaluating optimization:", error);
    return NextResponse.json({ score: 0 });
  }
}
