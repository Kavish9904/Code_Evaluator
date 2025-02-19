export interface TestCase {
  input: string;
  expectedOutput: string;
  solution: string;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  requirements: string[];
  testCases: TestCase[];
}

export interface Submission {
  prompt: string;
  timestamp: Date;
  passed: boolean;
  optimizationScore: number;
}

export interface QuestionState {
  solutionUnlocked: boolean;
  submissions: Submission[];
  bestScore: number;
}
