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
  Code2,
  Lightbulb,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="/">
          <GraduationCapIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            CodeEvaluator
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <Button
            variant="ghost"
            onClick={handleLogin}
            className="hover:text-primary text-sm sm:text-base"
          >
            Login
          </Button>
          <Button
            onClick={handleGetStarted}
            className="bg-primary hover:bg-primary/90 text-sm sm:text-base"
          >
            Sign Up
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary/10 rounded-full blur-3xl" />
          </div>

          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col items-center space-y-6 sm:space-y-8 text-center">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Master the Art of Writting Code
                </h1>
                <p className="mx-auto max-w-[600px] sm:max-w-[700px] text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 px-4">
                  Challenge yourself with our coding problems and compete with
                  others. Improve your skills and climb the ranks.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Button
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
                  onClick={handleGetStarted}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-primary/20 hover:bg-primary/5 w-full sm:w-auto"
                  onClick={() => router.push("/rankings")}
                >
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                  View Rankings
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background/50 to-background">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                Why Choose CodeEvaluator?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto text-sm sm:text-base">
                Our platform offers everything you need to improve your coding
                skills and compete with others.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">
                    Challenging Problems
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Tackle diverse coding challenges designed to test and
                    improve your skills
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">
                    Real-time Feedback
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Get instant feedback on your solutions and learn from your
                    mistakes
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">
                    Global Rankings
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Compete with developers worldwide and track your progress
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-4 sm:py-6 w-full shrink-0 items-center px-4 sm:px-6 lg:px-8 border-t bg-background/80 backdrop-blur-sm">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 CodeEvaluator. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
