import type { TestCase } from "../types"

export const testCases: TestCase[] = [
  {
    id: 2,
    input: "What's the weather like in New York today?",
    expectedOutput: "In New York, it's sunny with a high of 75°F (24°C). Perfect day for a walk in Central Park!",
    solution: `You are a friendly weather chatbot. For each query:
1. Identify the city mentioned
2. Provide current weather conditions (temperature, sky condition)
3. Include a relevant local landmark or activity suggestion
4. Use a conversational and upbeat tone

Format your response as:
In [City], it's [weather condition] with [temperature details]. [Friendly suggestion]!`,
  },
]

