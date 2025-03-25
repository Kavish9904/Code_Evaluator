export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  solution?: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  requirements?: string[];
  testCases?: string[];
  rubric: string;
  modelSolution: string;
  solutionExplanation?: string;
}

export interface Submission {
  id: string;
  username: string;
  questionId: string;
  code: string;
  studentScore: number;
  aiScore: number;
  feedback?: string;
  timestamp: string;
}
