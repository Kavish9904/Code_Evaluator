"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { GraduationCapIcon } from "lucide-react";
import { authService } from "../../services/auth";

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
    } else {
      setUser(currentUser);
    }
  }, [router]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/questions");
        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleQuestionSelect = (questionId: string) => {
    router.push(`/challenges?id=${questionId}`);
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "text-green-600 shadow-green-700/50";
      case "medium":
        return "text-yellow-600 shadow-yellow-700/50";
      case "hard":
        return "text-red-600 shadow-red-700/50";
      default:
        return "text-blue-600 shadow-blue-700/50";
    }
  };

  const stats = {
    totalQuestions: questions.length,
    easyQuestions: questions.filter((q) => q.difficulty === "Easy").length,
    mediumQuestions: questions.filter((q) => q.difficulty === "Medium").length,
    hardQuestions: questions.filter((q) => q.difficulty === "Hard").length,
  };

  if (!user) return null;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b">
        <Link className="flex items-center justify-center" href="/">
          <GraduationCapIcon className="h-6 w-6" />
          <span className="ml-2 text-lg font-bold">CodeEvaluator</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/rankings"
            className="text-sm font-medium hover:underline"
          >
            Rankings
          </Link>
          <Link href="/profile" className="text-sm font-medium hover:underline">
            Profile
          </Link>
        </nav>
      </header>
      <main className="flex-1 py-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Welcome, {user.name}</h1>
          <div className="grid gap-6 md:grid-cols-2">
            {questions.map((question) => (
              <Card
                key={question.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-xl font-semibold mb-2 truncate">
                    {question.title}
                  </CardTitle>
                  <CardDescription>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(
                        question.difficulty
                      )} shadow-[0_0_10px_-1px] animate-pulse`}
                    >
                      {question.difficulty}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {question.description}
                  </p>
                  <Button onClick={() => handleQuestionSelect(question.id)}>
                    Start Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 CodeEvaluator. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
