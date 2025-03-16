export interface TestCase {
  id: number;
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
  testCases: number[];
}
