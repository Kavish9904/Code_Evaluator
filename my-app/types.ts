export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  explanation?: string;
  solution?: string;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  requirements: string[];
  testCases: number[];
  sampleInput?: string;
  sampleOutput?: string;
  constraints?: string[];
}

export interface Submission {
  submissionNumber: number;
  rating?: number;
  promptText?: string;
  prompt?: string;
  code?: string;
  timestamp: any;
  username: string;
  studentScore: number;
  aiScore: number;
  aiFeedback: string;
  absoluteDifference: number;
  questionId: number;
  questionDifficulty: "Easy" | "Medium" | "Hard";
  passed: boolean;
  testCaseInput?: string;
  testCaseOutput?: string;
  attempts?: number;
}
