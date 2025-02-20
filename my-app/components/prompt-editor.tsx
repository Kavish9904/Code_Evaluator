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
import type { Question, TestCase } from "../types";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useState } from "react";

interface PromptEditorProps {
  initialQuestion?: Question;
}

export function PromptEditor({ initialQuestion }: PromptEditorProps) {
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
  const [submissions, setSubmissions] = React.useState<
    Array<{
      submissionNumber: number;
      rating: number;
      promptText: string;
      timestamp: string;
    }>
  >([]);
  const [expandedSubmission, setExpandedSubmission] = useState<number | null>(
    null
  );

  const currentQuestion = questions[currentQuestionIndex];

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
      setTestResult("Please select a test case and enter a prompt");
      return;
    }

    setIsEvaluating(true);
    setTestResult("Evaluating results...");
    setShowSolution(false);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          testCase: selectedTestCase,
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

Actual Output:
${result.output}

${result.passed ? "✅ Test Passed!" : "❌ Test Failed!"}`;

        setTestResult(formattedResult);
      } else {
        throw new Error(result.error || "Evaluation failed");
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

  const handleSubmit = async () => {
    if (!hasPassedTest || !prompt || !selectedTestCase) {
      toast.error("Please pass the test first!");
      return;
    }

    // Check if prompt is too similar to solution
    const currentSolution = currentQuestion.testCases[0].solution;
    if (prompt.trim() === currentSolution.trim()) {
      toast.error(
        "Cannot submit the exact solution. Please write your own prompt."
      );
      return;
    }

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          questionId: currentQuestion.id,
          testCase: selectedTestCase,
          passed: hasPassedTest,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Submitted successfully!`);
        setPrompt("");
        setSelectedTestCase(null);
        setHasPassedTest(false);
        setTestResult(null);
        fetchSubmissions();
      } else {
        toast.error(result.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Error submitting prompt");
    }
  };

  const fetchSubmissions = async () => {
    try {
      const submissionsRef = collection(db, "submissions");
      const q = query(
        submissionsRef,
        where("questionId", "==", currentQuestion.id)
      );

      const querySnapshot = await getDocs(q);
      const submissionsData = querySnapshot.docs.map((doc) => ({
        submissionNumber: doc.data().submissionNumber,
        rating: doc.data().rating,
        promptText: doc.data().promptText,
        timestamp: doc.data().timestamp,
      }));

      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  React.useEffect(() => {
    fetchSubmissions();
  }, [currentQuestion.id]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-4 h-14 border-b">
        <div className="flex items-center space-x-4">
          <GraduationCap className="w-6 h-6" />
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Problems</span>
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
            onClick={handleSubmit}
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
                  {submissions.length > 0 ? (
                    <div className="space-y-2">
                      {submissions.map((submission) => (
                        <div
                          key={submission.submissionNumber}
                          className="border rounded-lg"
                        >
                          <button
                            onClick={() =>
                              setExpandedSubmission(
                                expandedSubmission ===
                                  submission.submissionNumber
                                  ? null
                                  : submission.submissionNumber
                              )
                            }
                            className="w-full p-4 flex justify-between items-center hover:bg-muted/50 transition-colors"
                          >
                            <h3 className="font-semibold">
                              Submission {submission.submissionNumber}
                            </h3>
                            <Badge
                              variant={
                                submission.rating >= 90
                                  ? "secondary"
                                  : submission.rating >= 70
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              Rating: {submission.rating || 0}/100
                            </Badge>
                          </button>

                          {expandedSubmission ===
                            submission.submissionNumber && (
                            <div className="p-4 border-t bg-muted/30">
                              <div className="bg-muted p-4 rounded-md mb-2">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {submission.promptText ||
                                    "No prompt available"}
                                </pre>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Submitted:{" "}
                                {new Date(
                                  submission.timestamp
                                ).toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No submissions yet. Submit your first prompt!
                    </p>
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
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Write your prompt here..."
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
                  {currentQuestion.testCases.map((testCase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <Button
                        variant={
                          selectedTestCase === testCase ? "default" : "outline"
                        }
                        className="w-full justify-start mb-2"
                        onClick={() => setSelectedTestCase(testCase)}
                      >
                        Test Case {index + 1}
                      </Button>
                      <div className="text-sm">
                        <strong>Input:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded">
                          {testCase.input}
                        </pre>
                        <strong className="mt-2 block">Expected Output:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded">
                          {testCase.expectedOutput}
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
    </div>
  );
}
