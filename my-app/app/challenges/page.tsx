"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { PromptEditor } from "../../components/prompt-editor";
import { useEffect, useState } from "react";
import type { Question } from "../../types";
import { authService } from "../../services/auth";

export default function ChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams.get("id");
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchQuestion = async () => {
      try {
        // Check authentication first
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) {
          router.push("/login");
          return;
        }

        // If no question ID is provided, redirect to dashboard
        if (!questionId) {
          router.push("/dashboard");
          return;
        }

        setIsLoading(true);
        setError(null);
        // Decode the question ID before making the API request
        const decodedId = decodeURIComponent(questionId);
        console.log("[Challenges] Fetching question with ID:", decodedId);

        const response = await fetch(`/api/questions/${decodedId}`, {
          headers: authService.getAuthHeader(),
        });
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Question not found"
              : "Failed to fetch question"
          );
        }
        const data = await response.json();
        console.log("[Challenges] Fetched question data:", data);
        setQuestion(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load question"
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchQuestion();
  }, [questionId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-red-500">{error}</div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Question not found
      </div>
    );
  }

  return (
    <main>
      <PromptEditor initialQuestion={question} />
    </main>
  );
}
