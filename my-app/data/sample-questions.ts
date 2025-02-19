import type { Question } from "../types";

export const questions: Question[] = [
  {
    id: 1,
    title: "Sample Question",
    difficulty: "Easy",
    description: "This is a sample question",
    requirements: ["Requirement 1", "Requirement 2"],
    testCases: [
      {
        input: "Sample input",
        expectedOutput: "Sample output",
        solution: "Sample solution",
      },
    ],
  },
  {
    id: 2,
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
        solution: `Here's an effective prompt for email management:

"You are an email assistant helping to process incoming emails. For each email:
1. Determine priority (High/Medium/Low) based on urgency and sender
2. Categorize the email (Work/Meeting, Personal, etc.)
3. Suggest a professional and clear response
4. Include any necessary follow-up questions
5. Keep the response concise and actionable

Format the output exactly as:
Priority: [level]
Category: [category]
Suggested Response: [your response]"

This prompt works because it:
- Clearly specifies the required format
- Includes all necessary components
- Maintains professional tone
- Encourages appropriate follow-up`,
      },
      {
        input:
          "Subject: Weekly Newsletter\nFrom: news@tech.com\nBody: Check out this week's top tech stories!",
        expectedOutput:
          "Priority: Low\nCategory: Newsletter\nAction: Archive after reading",
        solution: "Similar solution structure as above...",
      },
    ],
  },
  {
    id: 3,
    title: "Design a Code Review AI Assistant",
    description:
      "Create a prompt for an AI that can review code, suggest improvements, and identify potential bugs.",
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
        solution: `Here's an effective prompt for code review:

"As a code reviewer, analyze the given code and provide specific suggestions for improvement. Focus on:
1. Type safety and annotations
2. Input validation requirements
3. Potential edge cases and error handling
4. Code robustness and maintainability

Format your response as a numbered list of clear, actionable suggestions."

This prompt works because it:
- Clearly defines the review focus
- Specifies the required output format
- Emphasizes practical improvements
- Keeps suggestions concise and actionable`,
      },
    ],
  },
];
