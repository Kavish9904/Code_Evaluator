export type OtherType = {
  // your other types...
};

export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  solution?: string;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  requirements: string[];
  testCases: number[];
}

export interface Submission {
  submissionNumber?: number;
  rating?: number;
  promptText?: string;
  code?: string;
  timestamp?: string;
  username: string;
  studentScore: number;
  aiScore: number;
  aiFeedback: string;
  absoluteDifference: number;
  questionId: number;
  questionDifficulty: string;
  passed: boolean;
  testCaseInput?: string;
  testCaseOutput?: string;
  prompt?: string;
  id?: string;
  attempts?: number;
}
