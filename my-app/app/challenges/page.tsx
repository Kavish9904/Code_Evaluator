"use client"

import { useSearchParams } from "next/navigation"
import { PromptEditor } from "../../components/prompt-editor"
import { questions } from "../../data/sample-questions"

export default function ChallengePage() {
  const searchParams = useSearchParams()
  const questionId = searchParams.get("id")

  // Find the question by ID, or use the first question as default
  const currentQuestion = questionId ? questions.find((q) => q.id === Number.parseInt(questionId, 10)) : questions[0]

  if (!currentQuestion) {
    return <div>Question not found</div>
  }

  return (
    <main>
      <PromptEditor initialQuestion={currentQuestion} />
    </main>
  )
}

