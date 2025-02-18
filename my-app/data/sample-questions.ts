import type { Question } from "../types"

export const questions: Question[] = [
  {
    id: 1,
    title: "Create an AI Agent for Email Management",
    description:
      "Design a prompt that creates an AI agent capable of managing, categorizing, and responding to emails effectively.",
    difficulty: "Medium",
    requirements: [
      "Agent should be able to categorize emails by priority and type",
      "Must generate appropriate responses based on email content",
      "Should handle multiple email formats and languages",
      "Include error handling and edge cases",
    ],
    testCases: [
      {
        input:
          "Subject: Urgent Meeting Tomorrow\nFrom: boss@company.com\nBody: Need your presentation for tomorrow's client meeting by EOD.",
        expectedOutput:
          "Priority: High\nCategory: Work/Meeting\nSuggested Response: I'll prepare and send the presentation by end of day today. Would you like me to include any specific points?",
      },
      {
        input: "Subject: Weekly Newsletter\nFrom: news@tech.com\nBody: Check out this week's top tech stories!",
        expectedOutput: "Priority: Low\nCategory: Newsletter\nAction: Archive after reading",
      },
    ],
  },
  {
    id: 2,
    title: "Design a Code Review AI Assistant",
    description: "Create a prompt for an AI that can review code, suggest improvements, and identify potential bugs.",
    difficulty: "Hard",
    requirements: [
      "Analyze code structure and patterns",
      "Identify security vulnerabilities",
      "Suggest performance improvements",
      "Follow coding best practices",
    ],
    testCases: [
      {
        input: "function sum(a,b) { return a+b }",
        expectedOutput:
          "Suggestions:\n1. Add type annotations\n2. Add input validation\n3. Consider edge cases for numeric overflow",
      },
    ],
  },
]

