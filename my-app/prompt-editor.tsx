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
import { questions } from "./data/sample-questions";
import type { TestCase } from "./types";
import { testCases } from "./data/test-cases";

export function PromptEditor() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [prompt, setPrompt] = React.useState("");
  const [selectedTestCase, setSelectedTestCase] =
    React.useState<TestCase | null>(null);
  const [testResult, setTestResult] = React.useState<string | null>(null);

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

    // Simulate API call to test prompt
    setTestResult(
      "Testing prompt...\n\nInput:\n" +
        selectedTestCase.input +
        "\n\nExpected Output:\n" +
        selectedTestCase.expectedOutput +
        "\n\nYour prompt result will appear here after processing."
    );
  };

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
            disabled={!selectedTestCase || !prompt}
          >
            <Play className="w-4 h-4" />
            Run
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
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
            <Tabs defaultValue="question" className="h-full flex flex-col">
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
                Solutions content
              </TabsContent>
              <TabsContent value="submissions" className="flex-1 p-4">
                Submissions content
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
                          selectedTestCase?.id === testCase
                            ? "default"
                            : "outline"
                        }
                        className="w-full justify-start mb-2"
                        onClick={() => {
                          const fullTestCase = testCases.find(
                            (t: TestCase) => t.id === testCase
                          );
                          setSelectedTestCase(fullTestCase || null);
                        }}
                      >
                        Test Case {index + 1}
                      </Button>
                      <div className="text-sm">
                        <strong>Input:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded">
                          {
                            testCases.find((t: TestCase) => t.id === testCase)
                              ?.input
                          }
                        </pre>
                        <strong className="mt-2 block">Expected Output:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded">
                          {
                            testCases.find((t: TestCase) => t.id === testCase)
                              ?.expectedOutput
                          }
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="results" className="p-4">
              <ScrollArea className="h-48">
                <pre className="text-sm text-muted-foreground">
                  {testResult ||
                    "Run your prompt against a test case to see results..."}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
