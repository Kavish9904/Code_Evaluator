"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import {
  TrophyIcon,
  RocketIcon,
  Crown,
  Medal,
  Target,
  Award,
  Star,
  Users,
  Brain,
  Zap,
  GraduationCapIcon,
} from "lucide-react";

interface UserScore {
  username: string;
  totalScore: number;
  questionScores: {
    [key: string]: {
      score: number;
      difficulty: string;
      pointDifference: number;
      maxScore: number;
      studentScore: number;
      aiScore: number;
    };
  };
  uniqueQuestions: number;
  accuracy?: number;
  rank?: number;
}

export default function GlobalRankingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [userScores, setUserScores] = useState<UserScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalSubmissions: 0,
    averageScore: 0,
  });

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.username);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // Fetch submissions with auto-refresh
  useEffect(() => {
    fetchSubmissions();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchSubmissions, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateScore = (
    studentScore: number,
    aiScore: number,
    difficulty: string,
    maxScore: number
  ): number => {
    // Calculate the difference between student and AI scores
    const pointDifference = Math.abs(studentScore - aiScore);
    // Calculate base score (100% - difference percentage)
    const baseScore = Math.max(0, 100 - (pointDifference / maxScore) * 100);
    // Apply difficulty multiplier
    const multiplier =
      difficulty === "Hard" ? 3 : difficulty === "Medium" ? 2 : 1;
    return Math.round(baseScore * multiplier);
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/submissions", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch submissions");
      const submissions = await response.json();

      const userQuestionMap: { [key: string]: UserScore } = {};

      submissions.forEach((sub: any) => {
        const username = sub.username;
        const questionId = sub.questionId;
        const difficulty = sub.questionDifficulty || "Easy";
        const studentScore = sub.studentScore || 0;
        const aiScore = sub.aiScore || 0;
        const maxScore = sub.maxScore || 100;

        if (!userQuestionMap[username]) {
          userQuestionMap[username] = {
            username,
            totalScore: 0,
            questionScores: {},
            uniqueQuestions: 0,
          };
        }

        const score = calculateScore(
          studentScore,
          aiScore,
          difficulty,
          maxScore
        );

        if (
          !userQuestionMap[username].questionScores[questionId] ||
          score > userQuestionMap[username].questionScores[questionId].score
        ) {
          userQuestionMap[username].questionScores[questionId] = {
            score,
            difficulty,
            pointDifference: Math.abs(studentScore - aiScore),
            maxScore,
            studentScore,
            aiScore,
          };
        }
      });

      const scores = Object.values(userQuestionMap).map((user) => {
        const totalScore = Object.values(user.questionScores).reduce(
          (sum, q) => sum + q.score,
          0
        );

        // Calculate accuracy based on score differences
        const accuracy =
          Object.values(user.questionScores).reduce(
            (sum, q) => sum + (100 - (q.pointDifference / q.maxScore) * 100),
            0
          ) / Object.keys(user.questionScores).length;

        return {
          ...user,
          totalScore,
          uniqueQuestions: Object.keys(user.questionScores).length,
          accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal place
        };
      });

      const sortedScores = scores
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((score, index) => ({ ...score, rank: index + 1 }));

      setUserScores(sortedScores);

      // Calculate global stats
      setStats({
        totalParticipants: sortedScores.length,
        totalSubmissions: submissions.length,
        averageScore: Math.round(
          sortedScores.reduce((acc, curr) => acc + curr.totalScore, 0) /
            sortedScores.length
        ),
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getDifficultyColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin text-primary">
            <RocketIcon className="w-8 h-8" />
          </div>
          <p className="text-lg text-muted-foreground">Loading rankings...</p>
        </div>
      </div>
    );
  }

  const currentUserRank =
    userScores.find((score) => score.username === user)?.rank || 0;

  // Sort users by different criteria
  const topPerformers = [...userScores]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 2);
  const mostActive = [...userScores]
    .sort((a, b) => b.uniqueQuestions - a.uniqueQuestions)
    .slice(0, 2);
  const highestAccuracy = [...userScores]
    .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b">
        <Link className="flex items-center justify-center" href="/">
          <GraduationCapIcon className="h-6 w-6" />
          <span className="ml-2 text-lg font-bold">CodeEvaluator</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:underline"
          >
            Dashboard
          </Link>
          <Link href="/profile" className="text-sm font-medium hover:underline">
            Profile
          </Link>
        </nav>
      </header>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <TrophyIcon className="w-8 h-8 text-yellow-500" />
              Global Rankings
            </h1>
            <p className="text-muted-foreground">
              Compete with the best and climb the ranks
            </p>
          </div>
          {user && currentUserRank > 0 && (
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span>Your Rank: {getRankDisplay(currentUserRank)}</span>
            </div>
          )}
        </div>

        {/* Leaderboard Categories */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Top Performers */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Users with the highest overall scores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div
                  key={performer.username}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {index === 0 ? "🏆" : "🥈"}
                    </span>
                    <span>{performer.username}</span>
                  </div>
                  <span className="font-bold">{performer.totalScore}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Most Active */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Most Active
              </CardTitle>
              <CardDescription>
                Users who solved the most questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mostActive.map((user, index) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {index === 0 ? "🏆" : "🥈"}
                    </span>
                    <span>{user.username}</span>
                  </div>
                  <span className="font-bold">{user.uniqueQuestions}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Highest Accuracy */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Highest Accuracy
              </CardTitle>
              <CardDescription>
                Users with the best solution accuracy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {highestAccuracy.map((user, index) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {index === 0 ? "🏆" : "🥈"}
                    </span>
                    <span>{user.username}</span>
                  </div>
                  <span className="font-bold">{user.accuracy}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Global Rankings Table */}
        <Card className="mt-8">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Global Rankings
            </CardTitle>
            <CardDescription>
              Rankings are based on question difficulty, accuracy, and total
              questions solved
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
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
                  {userScores.map((userScore) => (
                    <TableRow
                      key={userScore.username}
                      className={`
                        ${user === userScore.username ? "bg-primary/5" : ""}
                        ${userScore.rank === 1 ? "bg-yellow-500/5" : ""}
                        hover:bg-muted/50 transition-colors
                      `}
                    >
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {getRankDisplay(userScore.rank!)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {userScore.username}
                          {user === userScore.username && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {userScore.uniqueQuestions}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold ${getDifficultyColor(
                            userScore.accuracy || 0
                          )}`}
                        >
                          {(userScore.accuracy || 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold">
                            {userScore.totalScore.toFixed(0)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {userScore.uniqueQuestions} questions
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
