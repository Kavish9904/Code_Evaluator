export interface TestCase {
  input: string
  expectedOutput: string
}

export interface Question {
  id: number
  title: string
  description: string
  difficulty: "Easy" | "Medium" | "Hard"
  requirements: string[]
  testCases: TestCase[]
}

