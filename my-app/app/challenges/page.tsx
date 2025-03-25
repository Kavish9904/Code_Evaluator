"use client";

import { useSearchParams } from "next/navigation";
import { PromptEditor } from "../../components/prompt-editor";
import { useEffect, useState } from "react";
import type { Question } from "../../types";

export default function ChallengePage() {
  const searchParams = useSearchParams();
  const questionId = searchParams.get("id");
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/questions/${questionId || ""}`);
        if (!response.ok) {
          throw new Error("Failed to fetch question");
        }
        const data = await response.json();
        setQuestion(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load question"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
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
