"use client";

import { useState, useEffect } from "react";
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
import { questions } from "../../data/sample-questions";
import { authService } from "../../services/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
    } else {
      setUser(currentUser);
    }
  }, [router]);

  const handleQuestionSelect = (questionId: number) => {
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

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b">
        <Link className="flex items-center justify-center" href="/">
          <GraduationCapIcon className="h-6 w-6" />
          <span className="ml-2 text-lg font-bold">PromptMaster</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/profile"
          >
            Profile
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
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
          © 2025 PromptMaster. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
