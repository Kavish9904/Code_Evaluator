"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  RocketIcon,
  Brain,
  Target,
  Users,
  GraduationCapIcon,
  ArrowRight,
  Trophy,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
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
          <Link href="/login" className="text-sm font-medium hover:underline">
            Login
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Master the Art of Code Evaluation
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Challenge yourself with our coding problems and compete with
                  others. Improve your skills and climb the ranks.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/signup">
                  <Button className="gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/rankings">
                  <Button variant="outline" className="gap-2">
                    <Trophy className="h-4 w-4" />
                    View Rankings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <Brain className="h-8 w-8 mb-4 text-primary" />
                  <CardTitle>Challenging Problems</CardTitle>
                  <CardDescription>
                    Tackle diverse coding challenges designed to test and
                    improve your skills
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <Target className="h-8 w-8 mb-4 text-primary" />
                  <CardTitle>Real-time Feedback</CardTitle>
                  <CardDescription>
                    Get instant feedback on your solutions and learn from your
                    mistakes
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <Users className="h-8 w-8 mb-4 text-primary" />
                  <CardTitle>Global Rankings</CardTitle>
                  <CardDescription>
                    Compete with developers worldwide and track your progress
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 CodeEvaluator. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
