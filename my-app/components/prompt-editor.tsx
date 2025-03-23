"use client";

import * as React from "react";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
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
import { questions } from "../data/sample-questions";
import type { Question, TestCase, Submission } from "../types";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useState, useCallback, useEffect, useMemo } from "react";
import { testCases } from "../data/test-cases";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authService } from "../services/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "../lib/utils";

interface PromptEditorProps {
  initialQuestion?: Question;
}

// Memoized submission sorting and filtering
function useProcessedSubmissions(submissions: Submission[]) {
  return useMemo(() => {
    return submissions
      .filter(
        (submission) =>
          submission.username &&
          submission.username !== "Anonymous" &&
          (submission.code || submission.prompt) &&
          submission.passed
      )
      .sort((a, b) => {
        // Calculate weighted scores (70% difference, 30% attempts)
        const aScore =
          (100 - Math.abs(a.studentScore - a.aiScore)) * 0.7 +
          (100 / (a.attempts || 1)) * 0.3;
        const bScore =
          (100 - Math.abs(b.studentScore - b.aiScore)) * 0.7 +
          (100 / (b.attempts || 1)) * 0.3;
        return bScore - aScore; // Higher score is better
      });
  }, [submissions]);
}

// Score difference indicator component
function ScoreDifference({
  difference,
  attempts,
}: {
  difference: number;
  attempts: number;
}) {
  const color = useMemo(() => {
    if (difference <= 5) return "text-green-500";
    if (difference <= 10) return "text-yellow-500";
    return "text-red-500";
  }, [difference]);

  return (
    <div className="flex items-center gap-2">
      <span className={cn("font-medium", color)}>{difference}</span>
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            difference <= 5
              ? "bg-green-500"
              : difference <= 10
              ? "bg-yellow-500"
              : "bg-red-500"
          )}
          style={{ width: `${100 - Math.min(100, difference)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground ml-2">
        ({attempts} attempt{attempts !== 1 ? "s" : ""})
      </span>
    </div>
  );
}

// Helper function to calculate solved questions by difficulty
function getSolvedQuestionCounts(submissions: Submission[], username: string) {
  // Get all passed submissions for this user
  const userSubmissions = submissions.filter(
    (s) => s.username === username && s.passed
  );

  // Track unique solved questions
  const solvedQuestions = new Map<number, string>();
  userSubmissions.forEach((s) => {
    if (!solvedQuestions.has(s.questionId)) {
      solvedQuestions.set(s.questionId, s.questionDifficulty);
    }
  });

  // Count by difficulty
  const difficulties = Array.from(solvedQuestions.values());
  return {
    easy: difficulties.filter((d) => d === "Easy").length,
    medium: difficulties.filter((d) => d === "Medium").length,
    hard: difficulties.filter((d) => d === "Hard").length,
    total: difficulties.length,
  };
}

export function PromptEditor({ initialQuestion }: PromptEditorProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(
    initialQuestion
      ? questions.findIndex((q) => q.id === initialQuestion.id)
      : 0
  );
  const [prompt, setPrompt] = React.useState("");
  const [selectedTestCase, setSelectedTestCase] =
    React.useState<TestCase | null>(null);
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [hasPassedTest, setHasPassedTest] = React.useState(false);
  const [showSolution, setShowSolution] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("question");
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [studentScore, setStudentScore] = React.useState("");
  const [currentUser, setCurrentUser] = React.useState<{ name: string } | null>(
    null
  );
  const [expandedFeedback, setExpandedFeedback] = React.useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Use memoized submissions
  const validSubmissions = useProcessedSubmissions(submissions);

  // Memoize current user's best submission
  const userBestSubmission = useMemo(() => {
    if (!currentUser) return null;
    return validSubmissions.find((s) => s.username === currentUser.name);
  }, [validSubmissions, currentUser]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      toast.error("Please log in to submit solutions");
      return;
    }
    setCurrentUser(user);
  }, []);

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
    setPrompt("");
    setTestResult(null);
    setSelectedTestCase(null);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) =>
      prev < questions.length - 1 ? prev + 1 : prev
    );
    setPrompt("");
    setTestResult(null);
    setSelectedTestCase(null);
  };

  const handleRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestionIndex(randomIndex);
    setPrompt("");
    setTestResult(null);
    setSelectedTestCase(null);
  };

  const handleRunTest = async () => {
    if (!selectedTestCase || !prompt) {
      setTestResult("Please select a test case and enter your code");
      return;
    }

    setIsEvaluating(true);
    setTestResult("Evaluating code...");
    setShowSolution(false);

    try {
      const response = await fetch("/api/evaluate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: prompt,
          testCase: selectedTestCase,
          language: "javascript",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setHasPassedTest(result.passed);

        const formattedResult = `Test Results:

Input:
${selectedTestCase.input}

Expected Output:
${selectedTestCase.expectedOutput}

Your Output:
${result.output}

${result.passed ? "✅ Test Passed!" : "❌ Test Failed!"}
${result.error ? `\nError: ${result.error}` : ""}`;

        setTestResult(formattedResult);
      } else {
        throw new Error(result.error || "Code evaluation failed");
      }
    } catch (error) {
      setTestResult(
        `Error: ${error instanceof Error ? error.message : "An error occurred"}`
      );
      setHasPassedTest(false);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSubmitClick = () => {
    setShowSubmitDialog(true);
  };

  const handleSubmitConfirm = async () => {
    if (!hasPassedTest || !prompt || !selectedTestCase) {
      toast.error("Please pass the test first!");
      return;
    }

    // Check if code is too similar to solution only if user has seen the solution
    const fullTestCase = testCases[selectedTestCase.id];
    if (showSolution && prompt.trim() === fullTestCase?.solution?.trim()) {
      toast.error(
        "Cannot submit the exact solution after viewing it. Please write your own code."
      );
      return;
    }

    if (!currentUser) {
      toast.error("Please log in to submit solutions");
      return;
    }

    const score = parseInt(studentScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Please enter a valid score between 0 and 100");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: prompt,
          questionId: currentQuestion.id,
          testCase: selectedTestCase,
          passed: hasPassedTest,
          username: currentUser.name,
          studentScore: score,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Submitted successfully!`);
        setPrompt("");
        setSelectedTestCase(null);
        setHasPassedTest(false);
        setTestResult(null);
        setStudentScore("");
        setShowSubmitDialog(false);
        fetchSubmissions();
      } else {
        toast.error(result.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Error submitting code");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      const submissionsRef = collection(db, "submissions");
      const q = query(
        submissionsRef,
        where("questionId", "==", currentQuestion.id)
      );

      const querySnapshot = await getDocs(q);
      const submissionsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Raw submission data:", data); // Debug log for raw data
        return {
          submissionNumber: data.submissionNumber,
          rating: data.rating,
          promptText: data.promptText,
          code: data.code || data.prompt,
          timestamp: data.timestamp,
          username: data.username || "Anonymous",
          studentScore: Number(data.studentScore) || 0,
          aiScore: Number(data.aiScore) || 0,
          aiFeedback: data.aiFeedback || "",
          absoluteDifference: Number(data.absoluteDifference) || 0,
          questionId: Number(data.questionId),
          passed: Boolean(data.passed),
          testCaseInput: data.testCaseInput,
          testCaseOutput: data.testCaseOutput,
        };
      }) as Submission[];

      console.log("Processed submissions:", submissionsData); // Debug log for processed data
      setSubmissions(submissionsData);

      // Debug log for validSubmissions
      console.log(
        "Valid submissions:",
        submissionsData.filter(
          (submission) =>
            submission.username &&
            submission.username !== "Anonymous" &&
            (submission.code || submission.prompt) &&
            submission.passed
        )
      );
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    }
  }, [currentQuestion.id]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleBackToDashboard = () => {
    router.push("/problems");
  };

  const handleCopyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigator.clipboard.writeText(prompt);
    toast.success("Code copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-4 h-14 border-b">
        <div className="flex items-center space-x-4">
          <GraduationCap className="w-6 h-6" />
          <div className="flex items-center space-x-2">
            <span
              className="font-semibold cursor-pointer hover:text-primary transition-colors"
              onClick={handleBackToDashboard}
            >
              Problems
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRandomQuestion}
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
            disabled={!selectedTestCase || !prompt || isEvaluating}
          >
            {isEvaluating ? (
              "Evaluating..."
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run
              </>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={handleSubmitClick}
            disabled={!hasPassedTest}
          >
            <Upload className="w-4 h-4" />
            Submit
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          {/* Left Panel */}
          <div className="w-1/2 border-r">
            <Tabs
              defaultValue="question"
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <TabsList className="px-4 py-2 border-b justify-start">
                <TabsTrigger value="question" className="gap-2">
                  <FileQuestion className="w-4 h-4" />
                  Question
                </TabsTrigger>
                <TabsTrigger value="solutions" className="gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Solutions
                </TabsTrigger>
                <TabsTrigger value="submissions" className="gap-2">
                  <Users className="w-4 h-4" />
                  Submissions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="question" className="flex-1 p-4">
                <ScrollArea className="h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">
                      {currentQuestion.title}
                    </h2>
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
                  <p className="text-muted-foreground mb-4">
                    {currentQuestion.description}
                  </p>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Requirements:</h3>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                      {currentQuestion.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="solutions" className="flex-1 p-4">
                <ScrollArea className="h-full">
                  {showSolution && selectedTestCase ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Solution</h3>
                      <pre className="whitespace-pre-wrap text-sm p-4 bg-muted rounded-lg">
                        {selectedTestCase.solution}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground pt-8">
                      You can see the 'Solution' by clicking on 'Show Solution'
                      after failing a Test Case.
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="submissions" className="flex-1 p-4">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : validSubmissions.length > 0 ? (
                    <div className="space-y-6">
                      {/* User's Best Submission */}
                      {userBestSubmission && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <h3 className="font-semibold mb-2">
                            Your Best Submission
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">
                                Your Score
                              </div>
                              <div className="text-2xl font-bold">
                                {userBestSubmission.studentScore}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">
                                AI Score
                              </div>
                              <div className="text-2xl font-bold">
                                {userBestSubmission.aiScore}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">
                                Rank
                              </div>
                              <div className="text-2xl font-bold">
                                #
                                {validSubmissions.findIndex(
                                  (s) => s.username === currentUser!.name
                                ) + 1}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Leaderboard */}
                      <div className="bg-card rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                          <h3 className="font-semibold">Leaderboard</h3>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableCell className="font-medium w-16">
                                Rank
                              </TableCell>
                              <TableCell className="font-medium">
                                Username
                              </TableCell>
                              <TableCell className="font-medium text-center">
                                Scores
                              </TableCell>
                              <TableCell className="font-medium">
                                Difference
                              </TableCell>
                              <TableCell className="font-medium">
                                Feedback
                              </TableCell>
                              <TableCell className="font-medium">
                                Solved Questions
                              </TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {validSubmissions.map((submission, index) => (
                              <React.Fragment key={index}>
                                <TableRow
                                  className={cn(
                                    currentUser?.name === submission.username &&
                                      "bg-primary/5",
                                    "transition-colors hover:bg-muted/50 cursor-pointer"
                                  )}
                                  onClick={() =>
                                    setExpandedFeedback(
                                      expandedFeedback === index ? null : index
                                    )
                                  }
                                >
                                  <TableCell className="font-medium">
                                    {index === 0
                                      ? "🥇"
                                      : index === 1
                                      ? "🥈"
                                      : index === 2
                                      ? "🥉"
                                      : index + 1}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {submission.username}
                                      {currentUser?.name ===
                                        submission.username && (
                                        <Badge variant="secondary">You</Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-center items-center gap-2">
                                      <div className="text-center">
                                        <div className="font-medium">
                                          {submission.studentScore}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Student
                                        </div>
                                      </div>
                                      <div className="text-muted-foreground">
                                        vs
                                      </div>
                                      <div className="text-center">
                                        <div className="font-medium">
                                          {submission.aiScore}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          AI
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <ScoreDifference
                                      difference={Math.abs(
                                        submission.studentScore -
                                          submission.aiScore
                                      )}
                                      attempts={submission.attempts || 1}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center justify-between">
                                      <span className="truncate max-w-[200px]">
                                        {submission.aiFeedback}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent row click
                                          setExpandedFeedback(
                                            expandedFeedback === index
                                              ? null
                                              : index
                                          );
                                        }}
                                      >
                                        {expandedFeedback === index
                                          ? "Less"
                                          : "More"}
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {(() => {
                                        const counts = getSolvedQuestionCounts(
                                          submissions,
                                          submission.username
                                        );
                                        return `E: ${counts.easy} | M: ${counts.medium} | H: ${counts.hard}`;
                                      })()}
                                    </div>
                                  </TableCell>
                                </TableRow>
                                <AnimatePresence>
                                  {expandedFeedback === index && (
                                    <motion.tr
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <TableCell colSpan={5} className="p-0">
                                        <motion.div
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="bg-muted/30 p-4 mx-4 my-2 rounded-lg"
                                        >
                                          <div className="space-y-4">
                                            <div>
                                              <Label>AI Feedback</Label>
                                              <div className="mt-2 p-4 bg-muted rounded-lg">
                                                <p className="text-sm whitespace-pre-wrap">
                                                  {submission.aiFeedback}
                                                </p>
                                              </div>
                                            </div>
                                            {currentUser?.name ===
                                              submission.username && (
                                              <div className="mt-4 border-t pt-4">
                                                <Label>Your Code</Label>
                                                <pre className="mt-2 p-4 bg-slate-950 rounded-lg overflow-x-auto">
                                                  <code className="text-white text-sm whitespace-pre-wrap">
                                                    {submission.code ||
                                                      "undefined"}
                                                  </code>
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      </TableCell>
                                    </motion.tr>
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No submissions yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Be the first to submit your solution!
                      </p>
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
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Write your code here..."
                className="h-full min-h-[200px] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="border-t h-64">
          <Tabs defaultValue="testcases">
            <TabsList className="px-4 py-2 border-b justify-start">
              <TabsTrigger value="testcases" className="gap-2">
                <TestTube className="w-4 h-4" />
                Test Cases
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <FileOutput className="w-4 h-4" />
                Results
              </TabsTrigger>
            </TabsList>
            <TabsContent value="testcases" className="p-4">
              <ScrollArea className="h-48">
                <div className="space-y-4">
                  {currentQuestion.testCases.map((testCaseId, index) => (
                    <div key={testCaseId} className="border rounded-lg p-4">
                      <Button
                        variant={
                          selectedTestCase?.id === testCaseId
                            ? "default"
                            : "outline"
                        }
                        className="w-full justify-start mb-2"
                        onClick={() => {
                          const fullTestCase = testCases[testCaseId];
                          if (fullTestCase) {
                            setSelectedTestCase(fullTestCase);
                          }
                        }}
                      >
                        Test Case {index + 1}
                      </Button>
                      <div className="text-sm">
                        <strong>Input:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded">
                          {testCases[testCaseId]?.input}
                        </pre>
                        <strong className="mt-2 block">Expected Output:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded">
                          {testCases[testCaseId]?.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="results" className="p-4">
              <ScrollArea className="h-48">
                <div className="space-y-4">
                  <pre className="text-sm">
                    {testResult ||
                      "Run your prompt against a test case to see results..."}
                  </pre>
                  {testResult && testResult.includes("❌ Test Failed!") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => {
                        setShowSolution(true);
                        setActiveTab("solutions");
                        const solutionsTab = document.querySelector(
                          'button[value="solutions"]'
                        ) as HTMLElement;
                        if (solutionsTab) {
                          solutionsTab.click();
                        }
                      }}
                    >
                      Show Solution
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Your Solution</DialogTitle>
            <DialogDescription>
              Please enter your self-reported score before submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="score">Self-reported Score (0-100)</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                value={studentScore}
                onChange={(e) => setStudentScore(e.target.value)}
                placeholder="Enter your score"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitConfirm}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add copy button */}
      <Button onClick={handleCopyClick} className="mt-2">
        Copy Code
      </Button>
    </div>
  );
}
