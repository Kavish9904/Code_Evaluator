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
    };
  };
  uniqueQuestions: number;
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
    pointDifference: number,
    difficulty: string
  ): number => {
    const baseScore = Math.max(0, 100 - pointDifference); // Ensure score doesn't go negative
    const multiplier =
      difficulty === "Hard" ? 3 : difficulty === "Medium" ? 2 : 1;
    return baseScore * multiplier;
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/submissions", {
        cache: "no-store", // Prevent caching
      });
      if (!response.ok) throw new Error("Failed to fetch submissions");
      const submissions = await response.json();

      const userQuestionMap: { [key: string]: UserScore } = {};

      submissions.forEach((sub: any) => {
        const username = sub.username;
        const questionId = sub.questionId;
        const difficulty = sub.questionDifficulty || "Easy";
        const pointDifference = Math.abs(sub.studentScore - sub.aiScore);

        if (!userQuestionMap[username]) {
          userQuestionMap[username] = {
            username,
            totalScore: 0,
            questionScores: {},
            uniqueQuestions: 0,
          };
        }

        const score = calculateScore(pointDifference, difficulty);

        if (
          !userQuestionMap[username].questionScores[questionId] ||
          score > userQuestionMap[username].questionScores[questionId].score
        ) {
          userQuestionMap[username].questionScores[questionId] = {
            score,
            difficulty,
            pointDifference,
          };
        }
      });

      const scores = Object.values(userQuestionMap).map((user) => {
        const totalScore = Object.values(user.questionScores).reduce(
          (sum, q) => sum + q.score,
          0
        );

        return {
          ...user,
          totalScore,
          uniqueQuestions: Object.keys(user.questionScores).length,
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

  const currentUserRank =
    userScores.find((score) => score.username === user)?.rank || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b">
        <Link className="flex items-center justify-center" href="/">
          <GraduationCapIcon className="h-6 w-6" />
          <span className="ml-2 text-lg font-bold">CodeEvaluator</span>
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:underline"
              >
                Dashboard
              </Link>
              <Link
                href="/problems"
                className="text-sm font-medium hover:underline"
              >
                Problems
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium hover:underline"
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:underline"
              >
                Login
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <div className="container mx-auto py-8 px-4">
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
          <div className="flex gap-4">
            {user && currentUserRank > 0 && (
              <Button variant="outline" className="gap-2">
                <Crown className="w-4 h-4" />
                Your Rank: {getRankDisplay(currentUserRank)}
              </Button>
            )}
            <Button onClick={() => router.push("/problems")} className="gap-2">
              <RocketIcon className="w-4 h-4" />
              Start Coding
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalParticipants}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}</div>
            </CardContent>
          </Card>
        </div>

        {/* Rankings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>
              Top performers ranked by total score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Challenges Completed</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userScores.map((userScore) => (
                  <TableRow
                    key={userScore.username}
                    className={
                      user === userScore.username ? "bg-primary/5" : undefined
                    }
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
                    <TableCell>{userScore.uniqueQuestions}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-bold ${getDifficultyColor(
                          userScore.totalScore
                        )}`}
                      >
                        {userScore.totalScore.toFixed(0)}
                      </span>
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
