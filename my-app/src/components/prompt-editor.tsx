import React, { useState } from "react";
import { toast } from "react-hot-toast";

interface TestResult {
  passed: boolean;
  output: string;
  error?: string;
}

export function PromptEditor() {
  const [selectedTestCase, setSelectedTestCase] = useState<{
    input: string;
    expectedOutput: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [hasPassedTest, setHasPassedTest] = useState(false);

  const handleRunTest = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          prompt: solution,
          testCase: selectedTestCase,
        }),
      });

      const result = await response.json();
      console.log("API Response:", result);

      setTestResult(result);
      setHasPassedTest(result.passed);

      if (result.error) {
        toast.error(result.error);
      } else if (result.passed) {
        toast.success("Test passed!");
      } else {
        toast.error("Test failed!");
      }
    } catch (error) {
      console.error("Test error:", error);
      setTestResult({
        passed: false,
        output: "Error occurred during test",
      });
      toast.error("Failed to run test");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={solution}
        onChange={(e) => setSolution(e.target.value)}
        className="w-full h-32 p-2 border rounded"
        placeholder="Enter your solution..."
      />
      <button
        onClick={handleRunTest}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isLoading ? "Running..." : "Run Test"}
      </button>
      {testResult && (
        <div
          className={`p-4 rounded ${
            hasPassedTest ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {testResult.output}
        </div>
      )}
    </div>
  );
}
