import axios from "axios";
import { cookies } from "next/headers";

const API_URL = "https://codeevaluator.onrender.com/api";

export interface CodeSubmission {
  code: string;
  language: string;
  problem_id: string;
}

export interface SubmissionStatus {
  status: string;
  message?: string;
}

export interface EvaluationResult {
  submission_id: string;
  status: string;
  score: number;
  feedback: string;
  test_results: Array<{
    test_case: string;
    passed: boolean;
    output: string;
    expected: string;
  }>;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  category: string;
  requirements: string[];
  test_cases: any[];
  rubric: any[];
  model_solution: string;
}

export interface SubmissionHistory {
  submission_id: string;
  problem_id: string;
  status: string;
  score: number;
  submitted_at: string;
}

class EvaluationService {
  private static instance: EvaluationService;

  private constructor() {}

  public static getInstance(): EvaluationService {
    if (!EvaluationService.instance) {
      EvaluationService.instance = new EvaluationService();
    }
    return EvaluationService.instance;
  }

  private getAuthHeader(): { Authorization: string } {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      throw new Error("User not authenticated");
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  public async submitCode(
    submission: CodeSubmission
  ): Promise<{ submission_id: string }> {
    try {
      console.log(
        "[EvaluationService] Submitting code for problem:",
        submission.problem_id
      );
      const response = await axios.post(
        `${API_URL}/evaluation/submit`,
        submission,
        {
          headers: {
            ...this.getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );
      console.log(
        "[EvaluationService] Code submission successful:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Code submission failed:", error);
      throw error;
    }
  }

  public async checkStatus(submissionId: string): Promise<SubmissionStatus> {
    try {
      console.log(
        "[EvaluationService] Checking status for submission:",
        submissionId
      );
      const response = await axios.get(
        `${API_URL}/evaluation/status/${submissionId}`,
        {
          headers: this.getAuthHeader(),
        }
      );
      console.log("[EvaluationService] Status check result:", response.data);
      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Status check failed:", error);
      throw error;
    }
  }

  public async getResults(submissionId: string): Promise<EvaluationResult> {
    try {
      console.log(
        "[EvaluationService] Fetching results for submission:",
        submissionId
      );
      const response = await axios.get(
        `${API_URL}/evaluation/results/${submissionId}`,
        {
          headers: this.getAuthHeader(),
        }
      );
      console.log("[EvaluationService] Results fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Failed to fetch results:", error);
      throw error;
    }
  }

  public async getSubmissionHistory(): Promise<SubmissionHistory[]> {
    try {
      console.log("[EvaluationService] Fetching submission history");
      const response = await axios.get(`${API_URL}/evaluation/history`, {
        headers: this.getAuthHeader(),
      });
      console.log("[EvaluationService] History fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Failed to fetch history:", error);
      throw error;
    }
  }

  public async getProblems(): Promise<Problem[]> {
    try {
      console.log("[EvaluationService] Fetching problems...");
      const response = await axios.get<Problem[]>(
        `${API_URL}/evaluation/problems`,
        {
          headers: this.getAuthHeader(),
        }
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format: expected an array");
      }

      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Error fetching problems:", error);
      throw error;
    }
  }

  public async getProblemDetails(problemId: string): Promise<Problem> {
    try {
      console.log(
        "[EvaluationService] Fetching details for problem:",
        problemId
      );
      const response = await axios.get(
        `${API_URL}/evaluation/problem/${problemId}`,
        {
          headers: this.getAuthHeader(),
        }
      );

      if (!response.data) {
        throw new Error("No data received from server");
      }

      return response.data;
    } catch (error) {
      console.error(
        "[EvaluationService] Failed to fetch problem details:",
        error
      );
      throw error;
    }
  }

  public async submitSolution(
    problemId: string,
    code: string,
    language: string
  ): Promise<any> {
    try {
      console.log("[EvaluationService] Submitting solution...");
      const response = await axios.post(
        `${API_URL}/evaluation/submit`,
        {
          problem_id: problemId,
          code,
          language,
        },
        {
          headers: this.getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Error submitting solution:", error);
      throw error;
    }
  }
}

export const evaluationService = EvaluationService.getInstance();
