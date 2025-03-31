import axios from "axios";
import { authService } from "./authService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";

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
  difficulty: string;
  test_cases: string[];
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

  private constructor() {
    console.log("[EvaluationService] Initialized");
  }

  public static getInstance(): EvaluationService {
    if (!EvaluationService.instance) {
      EvaluationService.instance = new EvaluationService();
    }
    return EvaluationService.instance;
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
            ...authService.getAuthHeader(),
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
      throw this.handleError(error);
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
          headers: authService.getAuthHeader(),
        }
      );
      console.log("[EvaluationService] Status check result:", response.data);
      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Status check failed:", error);
      throw this.handleError(error);
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
          headers: authService.getAuthHeader(),
        }
      );
      console.log("[EvaluationService] Results fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Failed to fetch results:", error);
      throw this.handleError(error);
    }
  }

  public async getSubmissionHistory(): Promise<SubmissionHistory[]> {
    try {
      console.log("[EvaluationService] Fetching submission history");
      const response = await axios.get(`${API_URL}/evaluation/history`, {
        headers: authService.getAuthHeader(),
      });
      console.log("[EvaluationService] History fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Failed to fetch history:", error);
      throw this.handleError(error);
    }
  }

  public async getProblems(): Promise<Problem[]> {
    try {
      console.log("[EvaluationService] Fetching available problems");
      const response = await axios.get(`${API_URL}/evaluation/problems`, {
        headers: authService.getAuthHeader(),
      });
      console.log("[EvaluationService] Problems fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("[EvaluationService] Failed to fetch problems:", error);
      throw this.handleError(error);
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
          headers: authService.getAuthHeader(),
        }
      );
      console.log(
        "[EvaluationService] Problem details fetched:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "[EvaluationService] Failed to fetch problem details:",
        error
      );
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || "An error occurred";
      return new Error(message);
    }
    return new Error("An unexpected error occurred");
  }
}

export const evaluationService = EvaluationService.getInstance();
