"use client";

import * as React from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Play,
  Upload,
  FileQuestion,
  Lightbulb,
  Users,
  GraduationCap,
  TestTube,
  FileOutput,
} from "lucide-react";
import type { Question, TestCase, Submission } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface PromptEditorProps {
  initialQuestion: Question;
}

interface CodeSubmission {
  username: string;
  studentScore: number;
  aiScore: number;
  feedback: string;
  code: string;
  timestamp: string;
  questionId: string;
}

export function PromptEditor({ initialQuestion }: PromptEditorProps) {
  const [questions, setQuestions] = React.useState<Question[]>([
    initialQuestion,
  ]);
  const [isLoadingQuestions, setIsLoadingQuestions] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [selectedTestCase, setSelectedTestCase] =
    React.useState<TestCase | null>(null);
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(
    null
  );
  const [submissions, setSubmissions] = React.useState<CodeSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = React.useState(false);
  const [mainTab, setMainTab] = React.useState("question");
  const [bottomTab, setBottomTab] = React.useState("rubric");
  const [isSolutionUnlocked, setIsSolutionUnlocked] = React.useState(false);
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [showSelfEvalDialog, setShowSelfEvalDialog] = React.useState(false);
  const [selfScore, setSelfScore] = React.useState<number>(0);
  const [username, setUsername] = React.useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    React.useState<CodeSubmission | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = React.useState(false);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [bestScore, setBestScore] = React.useState(0);
  const [userRank, setUserRank] = React.useState(0);

  // Fetch username on mount
  React.useEffect(() => {
    const fetchUsername = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (data.username) {
          setUsername(data.username);
          setShowLoginDialog(false);
        } else {
          setUsername(null);
          setShowLoginDialog(true);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
        setUsername(null);
        setShowLoginDialog(true);
      }
    };

    fetchUsername();
  }, []);

  const currentQuestion = React.useMemo(
    () => initialQuestion,
    [initialQuestion]
  );

  const handleRunTest = async () => {
    if (!prompt) {
      setTestResult("Please enter your code first");
      return;
    }

    setIsEvaluating(true);
    setTestResult("Evaluating your code...");
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: prompt,
          questionId: currentQuestion.id,
          category: currentQuestion.category,
          title: currentQuestion.title,
          rubric: currentQuestion.rubric,
          modelSolution: currentQuestion.modelSolution,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate code");
      }

      const result = await response.json();
      console.log("Evaluation result:", result);

      // Format the feedback based on its structure
      let formattedFeedback = "No feedback available";
      if (result.feedback) {
        if (typeof result.feedback === "string") {
          formattedFeedback = result.feedback;
        } else if (typeof result.feedback === "object") {
          formattedFeedback = Object.entries(result.feedback)
            .map(([key, value]: [string, any]) => {
              if (value.points_awarded !== undefined) {
                return `Criterion ${key}:\nPoints: ${value.points_awarded}/${value.max_points}\n${value.feedback}\n`;
              }
              return `${key}: ${value}\n`;
            })
            .join("\n");
        }
      }

      setTestResult(
        `Score: ${result.score || 0}\n\nFeedback:\n${formattedFeedback}`
      );
    } catch (error) {
      console.error("Error evaluating code:", error);
      setTestResult("Failed to evaluate code. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmit = async () => {
    if (!prompt || !username) {
      setSubmissionError(
        !username ? "Please log in first" : "Please write your prompt"
      );
      return;
    }

    // Show self-evaluation dialog instead of submitting directly
    setShowSelfEvalDialog(true);
  };

  const handleFinalSubmit = async () => {
    if (!username) {
      setSubmissionError("Unable to submit: No username available");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    setTestResult("⏳ Submitting your code for evaluation...");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: prompt,
          questionId: currentQuestion.id,
          studentScore: selfScore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit solution");
      }

      const data = await response.json();

      // Close dialog and switch to submissions tab
      setShowSelfEvalDialog(false);
      setMainTab("submissions");

      // Add the new submission to the list
      setSubmissions((prev) => [data, ...prev]);

      // Format and show evaluation results
      const formattedFeedback =
        typeof data.feedback === "object"
          ? Object.entries(data.feedback)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n")
          : data.feedback;

      setTestResult(
        `✅ Evaluation completed!\n\n` +
          `AI Score: ${data.aiScore}\n\n` +
          `Feedback:\n${formattedFeedback}`
      );
      setBottomTab("results");
    } catch (error) {
      console.error("Submission error:", error);
      setSubmissionError(
        error instanceof Error ? error.message : "Failed to save submission"
      );
      setTestResult(
        "❌ " +
          (error instanceof Error
            ? error.message
            : "Failed to evaluate submission")
      );
      setShowSelfEvalDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to format feedback for display
  const formatFeedback = (feedback: any): string => {
    if (!feedback) return "No feedback available";

    if (typeof feedback === "object" && feedback !== null) {
      // If feedback is an array of objects
      if (Array.isArray(feedback)) {
        return feedback
          .map((item) => {
            if (typeof item === "object") {
              return Object.entries(item)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ");
            }
            return String(item);
          })
          .join("\n");
      }
      // If feedback is a single object
      return Object.entries(feedback)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
    }
    // If feedback is a string or any other type
    return String(feedback);
  };

  // Update the submissions rendering
  const renderSubmissionFeedback = (feedback: any) => {
    const formattedFeedback = formatFeedback(feedback);
    return (
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">
          {formattedFeedback.split("\n")[0]}
        </p>
      </div>
    );
  };

  // Update the fetchSubmissions function with new ranking logic
  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const response = await fetch(
        `/api/submissions?questionId=${currentQuestion.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }
      const data = await response.json();

      // Sort submissions by absolute difference between student and AI scores
      const sortedSubmissions = data.sort(
        (a: CodeSubmission, b: CodeSubmission) => {
          const diffA = Math.abs(a.studentScore - a.aiScore);
          const diffB = Math.abs(b.studentScore - b.aiScore);
          return diffA - diffB; // Lower difference = higher rank
        }
      );

      setSubmissions(sortedSubmissions);

      // Update user's best score and rank for this question
      if (username) {
        const userSubmissions = sortedSubmissions.filter(
          (s: CodeSubmission) => s.username === username
        );
        if (userSubmissions.length > 0) {
          // Find submission with smallest difference
          const bestUserSubmission = userSubmissions.reduce(
            (best: CodeSubmission, current: CodeSubmission) => {
              const bestDiff = Math.abs(best.studentScore - best.aiScore);
              const currentDiff = Math.abs(
                current.studentScore - current.aiScore
              );
              return currentDiff < bestDiff ? current : best;
            },
            userSubmissions[0]
          );

          setBestScore(bestUserSubmission.studentScore);
          // Find rank of the best submission
          const userRank =
            sortedSubmissions.findIndex(
              (s: CodeSubmission) =>
                s.username === username &&
                Math.abs(s.studentScore - s.aiScore) ===
                  Math.abs(
                    bestUserSubmission.studentScore - bestUserSubmission.aiScore
                  )
            ) + 1;
          setUserRank(userRank);
        } else {
          setBestScore(0);
          setUserRank(0);
        }
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Update useEffect to fetch submissions when question changes
  React.useEffect(() => {
    if (mainTab === "submissions" && currentQuestion?.id) {
      fetchSubmissions();
    }
  }, [currentQuestion?.id, mainTab]);

  // Handle tab changes separately
  const handleMainTabChange = (value: string) => {
    setMainTab(value);
    if (value === "submissions") {
      fetchSubmissions();
    }
  };

  const handleBottomTabChange = (value: string) => {
    setBottomTab(value);
  };

  const handleShowSolution = () => {
    setIsSolutionUnlocked(true);
    setMainTab("solutions");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUsername = formData.get("username") as string;

    if (!newUsername?.trim()) {
      return;
    }

    // Clean the username before sending
    const cleanUsername = newUsername.includes("@")
      ? newUsername.split("@")[0]
      : newUsername;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: cleanUsername }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      setUsername(cleanUsername); // Use the cleaned username locally
      setShowLoginDialog(false);

      // Refresh submissions after login
      if (mainTab === "submissions") {
        fetchSubmissions();
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-4 h-14 border-b">
        <div className="flex items-center space-x-4">
          <GraduationCap className="w-6 h-6" />
          <div className="flex items-center space-x-4">
            <span className="font-semibold">Problems</span>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  (window.location.href = `/challenges?id=${
                    Number(currentQuestion.id) - 1
                  }`)
                }
                disabled={Number(currentQuestion.id) <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  (window.location.href = `/challenges?id=${
                    Number(currentQuestion.id) + 1
                  }`)
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const randomId = Math.floor(Math.random() * 20) + 1; // Assuming we have 20 questions
                  window.location.href = `/challenges?id=${randomId}`;
                }}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={handleRunTest}
            disabled={!prompt}
          >
            <Play className="w-4 h-4" />
            Run
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSubmit}
            disabled={!prompt || isSubmitting}
          >
            <Upload className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          {/* Left Panel */}
          <div className="w-1/2 border-r">
            <Tabs
              value={mainTab}
              className="h-full flex flex-col"
              onValueChange={handleMainTabChange}
            >
              <TabsList className="px-4 py-2 border-b justify-start">
                <TabsTrigger value="question" className="gap-2">
                  <FileQuestion className="w-4 h-4" />
                  Question
                </TabsTrigger>
                <TabsTrigger
                  value="solutions"
                  className="gap-2"
                  disabled={!isSolutionUnlocked}
                >
                  <Lightbulb className="w-4 h-4" />
                  Solutions{" "}
                  {!isSolutionUnlocked && (
                    <span className="ml-1 text-xs">(Locked)</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="submissions" className="gap-2">
                  <Users className="w-4 h-4" />
                  Submissions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="question" className="flex-1 p-4">
                <ScrollArea className="h-full">
                  {isLoadingQuestions ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-muted-foreground">
                        Loading questions...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">
                          {currentQuestion.title}
                        </h2>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {currentQuestion.category}
                          </Badge>
                          <Badge
                            variant={
                              currentQuestion.difficulty === "Easy"
                                ? "secondary"
                                : currentQuestion.difficulty === "Medium"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {currentQuestion.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                        {currentQuestion.description}
                      </p>
                      {currentQuestion.requirements &&
                        currentQuestion.requirements.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold">Requirements:</h3>
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                              {currentQuestion.requirements.map(
                                (req, index) => (
                                  <li key={index}>{req}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="solutions" className="flex-1 p-4">
                <ScrollArea className="h-full">
                  {!isSolutionUnlocked ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <Lightbulb className="w-12 h-12 text-muted-foreground" />
                      <p className="text-muted-foreground text-center">
                        Solutions are locked. Click the "Show Solution" button
                        after running your code to view the solution.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Model Solution</h3>
                      <div className="border rounded-lg p-4">
                        <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-md">
                          {currentQuestion.modelSolution ||
                            "No solution available"}
                        </pre>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">
                          Solution Explanation
                        </h4>
                        <p className="text-muted-foreground">
                          {currentQuestion.solutionExplanation ||
                            "No explanation available"}
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="submissions" className="flex-1 p-4">
                <ScrollArea className="h-full">
                  {isLoadingSubmissions ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-muted-foreground">
                        Loading submissions...
                      </span>
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <Users className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center space-y-2">
                        <p className="text-muted-foreground">
                          No submissions yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Be the first to submit a solution!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Best Submission Section */}
                      {username && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-8 border">
                          <h3 className="text-xl font-semibold mb-6">
                            Your Best Submission
                          </h3>
                          <div className="grid grid-cols-3 gap-12">
                            <div className="text-center">
                              <p className="text-sm font-medium mb-2">
                                Your Score
                              </p>
                              <p className="text-4xl font-bold text-blue-500">
                                {bestScore}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium mb-2">
                                AI Score
                              </p>
                              <p className="text-4xl font-bold text-purple-500">
                                {submissions[0]?.aiScore || "-"}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium mb-2">
                                Your Rank
                              </p>
                              <div className="flex items-center justify-center">
                                <p className="text-4xl font-bold text-green-500">
                                  #{userRank || "-"}
                                </p>
                                {userRank <= 3 && userRank > 0 && (
                                  <span className="ml-2 text-2xl">
                                    {userRank === 1
                                      ? "🥇"
                                      : userRank === 2
                                      ? "🥈"
                                      : "🥉"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Leaderboard Section */}
                      <div>
                        <h3 className="text-xl font-semibold mb-4">
                          Leaderboard for {currentQuestion.title}
                        </h3>
                        <div className="rounded-lg border overflow-hidden">
                          <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 font-medium text-sm">
                            <div>RANK</div>
                            <div>USERNAME</div>
                            <div>SCORES</div>
                            <div>DIFFERENCE</div>
                            <div>FEEDBACK</div>
                          </div>
                          <div className="divide-y">
                            {submissions.map((submission, index) => (
                              <div
                                key={index}
                                className={`grid grid-cols-5 gap-4 p-4 items-center hover:bg-muted/30 transition-colors ${
                                  submission.username === username
                                    ? "bg-blue-500/5"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    #{index + 1}
                                  </span>
                                  {index === 0 && (
                                    <span className="text-xl">🥇</span>
                                  )}
                                  {index === 1 && (
                                    <span className="text-xl">🥈</span>
                                  )}
                                  {index === 2 && (
                                    <span className="text-xl">🥉</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {submission.username}
                                  </span>
                                  {submission.username === username && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-blue-500/10 text-blue-500"
                                    >
                                      You
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-baseline gap-1">
                                    <span className="font-bold text-lg">
                                      {submission.studentScore}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Self
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    vs
                                  </span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="font-bold text-lg">
                                      {submission.aiScore}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      AI
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span
                                    className={`font-medium ${
                                      Math.abs(
                                        submission.studentScore -
                                          submission.aiScore
                                      ) === 0
                                        ? "text-green-500"
                                        : "text-yellow-500"
                                    }`}
                                  >
                                    {Math.abs(
                                      submission.studentScore -
                                        submission.aiScore
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  {renderSubmissionFeedback(
                                    submission.feedback
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-blue-500/10 hover:text-blue-500"
                                    onClick={() => {
                                      setSelectedSubmission(submission);
                                      setShowDetailsDialog(true);
                                    }}
                                  >
                                    Details
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <code className="text-sm">&lt;/&gt;</code>
                <span className="font-medium">Source Code</span>
              </div>
            </div>
            <div className="flex-1 p-4 bg-background">
              <Textarea
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setPrompt(e.target.value)
                }
                placeholder="Write your code here..."
                className="h-full min-h-[200px] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="border-t h-64">
          <Tabs value={bottomTab} onValueChange={handleBottomTabChange}>
            <TabsList className="px-4 py-2 border-b justify-start">
              <TabsTrigger value="rubric" className="gap-2">
                <TestTube className="w-4 h-4" />
                Evaluation Rubric
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <FileOutput className="w-4 h-4" />
                Results
              </TabsTrigger>
            </TabsList>
            <TabsContent value="rubric" className="p-4">
              <ScrollArea className="h-48">
                <div className="space-y-4">
                  {currentQuestion.rubric ? (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">
                        Evaluation Criteria
                      </h3>
                      <pre className="text-sm whitespace-pre-wrap">
                        {currentQuestion.rubric}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-muted-foreground">
                        No rubric available
                      </span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="results" className="p-4">
              <ScrollArea className="h-48">
                <div className="space-y-4">
                  <pre className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                    {submissionError ? (
                      <span className="text-red-500">{submissionError}</span>
                    ) : (
                      testResult ||
                      "Run your code to see evaluation feedback..."
                    )}
                  </pre>
                  {testResult &&
                    !submissionError &&
                    !isEvaluating &&
                    !testResult.includes("Evaluating") && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center italic">
                          To see your score, please submit your code using the
                          Submit button above.
                        </p>
                        <div className="flex justify-center">
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white w-full max-w-[200px]"
                            onClick={handleShowSolution}
                          >
                            <Lightbulb className="w-4 h-4" />
                            Show Solution
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Self-evaluation dialog */}
      {showSelfEvalDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">Self Evaluation</h3>
            <p className="text-sm text-muted-foreground">
              Based on the evaluation rubric, how would you score your solution?
              (0-100)
            </p>
            <div className="space-y-4">
              <input
                type="number"
                min="0"
                max="100"
                value={selfScore}
                onChange={(e) => setSelfScore(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSelfEvalDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Detailed feedback and analysis of the submission
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Submission Time</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedSubmission.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Question ID</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.questionId}
                  </p>
                </div>
              </div>
              {selectedSubmission.username === username ? (
                <div>
                  <h4 className="font-semibold mb-1">Code Submitted</h4>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                    {selectedSubmission.code}
                  </pre>
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-lg border border-muted-foreground/20">
                  <p className="text-sm text-muted-foreground text-center">
                    🔒 Code is private and only visible to the submitter
                  </p>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-1">Detailed Feedback</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Self Score</span>
                      <span className="text-blue-500 font-bold">
                        {selectedSubmission.studentScore}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">AI Score</span>
                      <span className="text-purple-500 font-bold">
                        {selectedSubmission.aiScore}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Difference</span>
                      <span
                        className={`font-bold ${
                          Math.abs(
                            selectedSubmission.studentScore -
                              selectedSubmission.aiScore
                          ) === 0
                            ? "text-green-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {Math.abs(
                          selectedSubmission.studentScore -
                            selectedSubmission.aiScore
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {formatFeedback(selectedSubmission.feedback)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      {showLoginDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Login Required</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="submit" variant="default">
                  Login
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
