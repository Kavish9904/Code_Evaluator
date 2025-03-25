"use client";

import * as React from "react";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ScrollArea } from "./components/ui/scroll-area";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
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
import type { TestCase as TestCaseType } from "./types";
import { testCases } from "./data/test-cases";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  requirements: string[];
  testCases: string[];
  rubric: string;
  modelSolution: string;
}

export function PromptEditor() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = React.useState(true);
  const [prompt, setPrompt] = React.useState("");
  const [selectedTestCase, setSelectedTestCase] =
    React.useState<TestCaseType | null>(null);
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(
    null
  );
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(questions.map((q) => q.category));
    return Array.from(uniqueCategories);
  }, [questions]);

  const filteredQuestions = React.useMemo(() => {
    if (!selectedCategory) return questions;
    return questions.filter((q) => q.category === selectedCategory);
  }, [questions, selectedCategory]);

  // Fetch questions from the backend
  React.useEffect(() => {
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
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  const currentQuestion = filteredQuestions[currentQuestionIndex] || {};

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
    setPrompt("");
    setTestResult(null);
    setSelectedTestCase(null);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) =>
      prev < filteredQuestions.length - 1 ? prev + 1 : prev
    );
    setPrompt("");
    setTestResult(null);
    setSelectedTestCase(null);
  };

  const handleRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    setCurrentQuestionIndex(randomIndex);
    setPrompt("");
    setTestResult(null);
    setSelectedTestCase(null);
  };

  const handleRunTest = async () => {
    if (!selectedTestCase || !prompt) {
      setTestResult("Please select a test case and enter a prompt");
      return;
    }

    // Simulate API call to test prompt
    setTestResult(
      "Testing prompt...\n\nInput:\n" +
        selectedTestCase.input +
        "\n\nExpected Output:\n" +
        selectedTestCase.expectedOutput +
        "\n\nYour prompt result will appear here after processing."
    );
  };

  const handleSubmit = async () => {
    if (!prompt || !selectedTestCase) {
      setSubmissionError(
        "Please write your prompt and select a test case first"
      );
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code: prompt,
          questionId: currentQuestion.id,
          testCase: selectedTestCase.id,
          passed: true, // We'll get this from the backend evaluation
          username: "user", // For now, using a default username
          studentScore: 0, // We'll get this from the backend evaluation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit solution");
      }

      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Submission error:", error);
      setSubmissionError(
        error instanceof Error ? error.message : "Failed to save submission"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to fetch submissions
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
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Fetch submissions when the submissions tab is selected
  const handleTabChange = (value: string) => {
    if (value === "submissions") {
      fetchSubmissions();
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
            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) =>
                setSelectedCategory(value === "all" ? null : value)
              }
              disabled={isLoadingQuestions}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  placeholder={
                    isLoadingQuestions ? "Loading..." : "All Categories"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {!isLoadingQuestions &&
                  categories.length > 0 &&
                  categories.filter(Boolean).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0 || isLoadingQuestions}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextQuestion}
                disabled={
                  currentQuestionIndex === filteredQuestions.length - 1 ||
                  isLoadingQuestions
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRandomQuestion}
                disabled={isLoadingQuestions}
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
            disabled={!selectedTestCase || !prompt}
          >
            <Play className="w-4 h-4" />
            Run
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSubmit}
            disabled={!selectedTestCase || !prompt || isSubmitting}
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
              defaultValue="question"
              className="h-full flex flex-col"
              onValueChange={handleTabChange}
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
                      {currentQuestion.requirements?.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold">Requirements:</h3>
                          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                            {currentQuestion.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="solutions" className="flex-1 p-4">
                Solutions content
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
                    <div className="flex items-center justify-center h-full">
                      <span className="text-muted-foreground">
                        No submissions yet
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Best Submission Section */}
                      <div className="bg-muted/50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Your Best Submission
                        </h3>
                        <div className="grid grid-cols-3 gap-8">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Your Score
                            </p>
                            <p className="text-4xl font-bold">
                              {Math.max(
                                ...submissions.map((s) => s.studentScore)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              AI Score
                            </p>
                            <p className="text-4xl font-bold">80</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Rank
                            </p>
                            <p className="text-4xl font-bold">#1</p>
                          </div>
                        </div>
                      </div>

                      {/* Leaderboard Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Leaderboard
                        </h3>
                        <div className="rounded-lg border">
                          <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                            <div>Rank</div>
                            <div>Username</div>
                            <div>Scores</div>
                            <div>Difference</div>
                            <div>Feedback</div>
                          </div>
                          <div className="divide-y">
                            {submissions.map((submission, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-5 gap-4 p-4 items-center"
                              >
                                <div className="flex items-center gap-2">
                                  <span>#{index + 1}</span>
                                  {/* Trophy emoji for top 3 */}
                                  {index < 3 && <span>🏆</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>{submission.username}</span>
                                  <Badge variant="secondary">You</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>{submission.studentScore}</span>
                                  <span className="text-muted-foreground text-sm">
                                    Student
                                  </span>
                                  <span>vs</span>
                                  <span>80</span>
                                  <span className="text-muted-foreground text-sm">
                                    AI
                                  </span>
                                </div>
                                <div>
                                  <span
                                    className={
                                      submission.studentScore > 80
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }
                                  >
                                    {submission.studentScore - 80}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {submission.feedback ||
                                      "Consider using line breaks to improve readability"}
                                  </span>
                                  <Button variant="ghost" size="sm">
                                    More
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
                <span className="font-medium">Prompt Code</span>
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
                  {currentQuestion.testCases?.map(
                    (testCaseId: string, index: number) => (
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
                            setSelectedTestCase(fullTestCase || null);
                          }}
                        >
                          Test Case {index + 1}
                        </Button>
                        <div className="text-sm">
                          <strong>Input:</strong>
                          <pre className="mt-1 p-2 bg-muted rounded">
                            {testCases[testCaseId]?.input}
                          </pre>
                          <strong className="mt-2 block">
                            Expected Output:
                          </strong>
                          <pre className="mt-1 p-2 bg-muted rounded">
                            {testCases[testCaseId]?.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="results" className="p-4">
              <ScrollArea className="h-48">
                <pre className="text-sm text-muted-foreground">
                  {submissionError ? (
                    <span className="text-red-500">{submissionError}</span>
                  ) : (
                    testResult ||
                    "Run your code against a test case to see results..."
                  )}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
