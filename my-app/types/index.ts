export type OtherType = {
  // your other types...
};

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  requirements?: string[];
  testCases?: TestCase[];
  rubric?: RubricItem[];
  modelSolution?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface RubricItem {
  id: string;
  description: string;
  points: number;
}

export interface Submission {
  id: string;
  userId: string;
  questionId: string;
  code: string;
  language: string;
  status: "pending" | "running" | "completed" | "failed";
  score?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}
