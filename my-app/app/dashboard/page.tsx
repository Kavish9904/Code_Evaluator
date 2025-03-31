"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { authService } from "../../services/auth";

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/questions");
        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await response.json();
        console.log("[Dashboard] Fetched questions:", data);
        setQuestions(data);
      } catch (error) {
        console.error("[Dashboard] Error fetching questions:", error);
        setError("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleQuestionSelect = (question: Question) => {
    console.log("[Dashboard] Button clicked for question:", question);
    console.log("[Dashboard] Question selected:", question);

    if (!question.id) {
      console.error(
        "[Dashboard] No question ID provided for question:",
        question
      );
      return;
    }

    console.log(
      "[Dashboard] Navigating to challenges with question ID:",
      question.id
    );
    const encodedId = encodeURIComponent(question.id);
    window.location.href = `/challenges?id=${encodedId}`;
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Questions</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map((question) => (
          <Card
            key={question.id}
            className="hover:shadow-lg transition-shadow flex flex-col"
          >
            <CardHeader>
              <CardTitle className="text-xl line-clamp-2 min-h-[3.5rem]">
                {question.title}
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{question.difficulty}</Badge>
                <Badge variant="outline">{question.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                {question.description}
              </p>
              <Button
                onClick={() => handleQuestionSelect(question)}
                className="w-full mt-auto"
              >
                Start Challenge
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
