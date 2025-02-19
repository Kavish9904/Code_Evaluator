import { type TestCase } from "@/types/test-types";

export const testCases: TestCase[] = [
  {
    input: "function sum(a,b) { return a+b }",
    expectedOutput: `Suggestions:
1. Add type annotations
2. Add input validation
3. Consider edge cases for numeric overflow`,
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
  {
    input: `Subject: Urgent Meeting Tomorrow
From: boss@company.com
Body: Need your presentation for tomorrow's client meeting by EOD.`,
    expectedOutput: `Priority: High
Category: Work/Meeting
Suggested Response: I'll prepare and send the presentation by end of day today. Would you like me to include any specific points?`,
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
];
