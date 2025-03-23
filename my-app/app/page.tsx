"use client";

import { Button } from "../components/ui/button";
import { GraduationCapIcon, TrophyIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Medal, Target } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { authService } from "../services/auth";
import { calculateUserStats } from "../lib/leaderboard-utils";
import type { Submission } from "../types";

interface UserStats {
  username: string;
  totalScore: number;
  questionsAttempted: number;
  averageAccuracy: number;
  questionsSolved: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [userStats, setUserStats] = useState<UserStats[]>([]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
    } else {
      setUser(currentUser);
      fetchSubmissions();
    }
  }, [router]);

  const fetchSubmissions = async () => {
    try {
      const submissionsRef = collection(db, "submissions");
      const querySnapshot = await getDocs(submissionsRef);
      const submissions = querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            submissionNumber: data.submissionNumber || 0,
            rating: data.rating || 0,
            promptText: data.promptText || "",
            timestamp: data.timestamp || "",
            username: data.username || "",
            studentScore: Number(data.studentScore) || 0,
            aiScore: Number(data.aiScore) || 0,
            aiFeedback: data.aiFeedback || "",
            absoluteDifference: Number(data.absoluteDifference) || 0,
            questionId: Number(data.questionId),
            questionDifficulty: data.questionDifficulty || "Easy",
            passed: Boolean(data.passed),
            testCaseInput: data.testCaseInput || "",
            testCaseOutput: data.testCaseOutput || "",
            prompt: data.prompt || "",
            id: doc.id,
          } as Submission;
        })
        .filter((sub) => sub.username && sub.username !== "Anonymous");

      const stats = calculateUserStats(submissions);
      setUserStats(stats);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleStartCoding = () => {
    router.push("/dashboard");
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0:
        return "🏆";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `#${index + 1}`;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              CodeEvaluator Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name}! See how you rank among other coders.
            </p>
          </div>
          <Button onClick={handleStartCoding} className="gap-2">
            <GraduationCapIcon className="w-4 h-4" />
            Start Coding
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrophyIcon className="w-4 h-4" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Users with the highest overall scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userStats.slice(0, 3).map((stat, index) => (
                <div
                  key={stat.username}
                  className="flex items-center justify-between mb-2 last:mb-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getRankEmoji(index)}</span>
                    <span className="font-medium">{stat.username}</span>
                  </div>
                  <span className="font-bold">
                    {stat.totalScore.toFixed(0)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="w-4 h-4" />
                Most Active
              </CardTitle>
              <CardDescription>
                Users who solved the most questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {[...userStats]
                .sort((a, b) => b.questionsAttempted - a.questionsAttempted)
                .slice(0, 3)
                .map((stat, index) => (
                  <div
                    key={stat.username}
                    className="flex items-center justify-between mb-2 last:mb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getRankEmoji(index)}</span>
                      <span className="font-medium">{stat.username}</span>
                    </div>
                    <span className="font-bold">{stat.questionsAttempted}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Highest Accuracy
              </CardTitle>
              <CardDescription>
                Users with the best solution accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {[...userStats]
                .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
                .slice(0, 3)
                .map((stat, index) => (
                  <div
                    key={stat.username}
                    className="flex items-center justify-between mb-2 last:mb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getRankEmoji(index)}</span>
                      <span className="font-medium">{stat.username}</span>
                    </div>
                    <span className="font-bold">
                      {stat.averageAccuracy.toFixed(1)}%
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Global Rankings</CardTitle>
            <CardDescription>
              Rankings are based on question difficulty, accuracy, and total
              questions solved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center">
                    Questions Solved
                  </TableHead>
                  <TableHead className="text-center">Accuracy</TableHead>
                  <TableHead className="text-right">Total Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats.map((stat, index) => (
                  <TableRow
                    key={stat.username}
                    className={
                      user.name === stat.username ? "bg-primary/5" : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {getRankEmoji(index)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {stat.username}
                        {user.name === stat.username && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {stat.questionsAttempted}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          E: {stat.questionsSolved.Easy} | M:{" "}
                          {stat.questionsSolved.Medium} | H:{" "}
                          {stat.questionsSolved.Hard}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {stat.averageAccuracy.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {stat.totalScore.toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
