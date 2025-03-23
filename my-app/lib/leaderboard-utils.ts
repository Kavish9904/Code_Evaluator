import { Submission } from "../types";
import { questions } from "../data/sample-questions";

interface UserStats {
  username: string;
  totalScore: number;
  questionsAttempted: number;
  questionsSolved: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  averageAccuracy: number;
  submissions: Submission[];
}

// Calculate difficulty multiplier for scoring
const getDifficultyMultiplier = (difficulty: string): number => {
  switch (difficulty) {
    case "Hard":
      return 3;
    case "Medium":
      return 2;
    case "Easy":
    default:
      return 1;
  }
};

// Calculate accuracy score (0-100)
const calculateAccuracyScore = (submission: Submission): number => {
  const accuracyScore = 100 - submission.absoluteDifference;
  return Math.max(0, Math.min(100, accuracyScore));
};

// Calculate total score for a submission
const calculateSubmissionScore = (submission: Submission): number => {
  const question = questions.find((q) => q.id === submission.questionId);
  if (!question) return 0;

  const difficultyMultiplier = getDifficultyMultiplier(question.difficulty);
  const accuracyScore = calculateAccuracyScore(submission);

  return accuracyScore * difficultyMultiplier;
};

// Group submissions by user and calculate their stats
export const calculateUserStats = (submissions: Submission[]): UserStats[] => {
  const userSubmissionsMap = new Map<string, Submission[]>();

  // Group submissions by username
  submissions.forEach((submission) => {
    const existingSubmissions =
      userSubmissionsMap.get(submission.username) || [];
    userSubmissionsMap.set(submission.username, [
      ...existingSubmissions,
      submission,
    ]);
  });

  // Calculate stats for each user
  const userStats: UserStats[] = Array.from(userSubmissionsMap.entries()).map(
    ([username, userSubmissions]) => {
      // Get unique question IDs that were passed
      const uniqueSolvedQuestionIds = new Set(
        userSubmissions.filter((s) => s.passed).map((s) => s.questionId)
      );

      // Count unique questions attempted
      const uniqueAttemptedQuestionIds = new Set(
        userSubmissions.map((s) => s.questionId)
      );

      // Count solved questions by difficulty
      const questionsSolved = {
        Easy: 0,
        Medium: 0,
        Hard: 0,
      };

      // Only count each question once per difficulty
      Array.from(uniqueSolvedQuestionIds).forEach((questionId) => {
        const question = questions.find((q) => q.id === questionId);
        if (question) {
          questionsSolved[
            question.difficulty as keyof typeof questionsSolved
          ]++;
        }
      });

      // Calculate average accuracy only for the best attempt per question
      const bestAttemptsByQuestion = new Map<number, Submission>();
      userSubmissions.forEach((submission) => {
        const existing = bestAttemptsByQuestion.get(submission.questionId);
        if (
          !existing ||
          submission.absoluteDifference < existing.absoluteDifference
        ) {
          bestAttemptsByQuestion.set(submission.questionId, submission);
        }
      });

      const accuracyScores = Array.from(bestAttemptsByQuestion.values()).map(
        calculateAccuracyScore
      );
      const averageAccuracy =
        accuracyScores.length > 0
          ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length
          : 0;

      // Calculate total score using best attempts only
      const totalScore = Array.from(bestAttemptsByQuestion.values()).reduce(
        (total, submission) => total + calculateSubmissionScore(submission),
        0
      );

      return {
        username,
        totalScore,
        questionsAttempted: uniqueAttemptedQuestionIds.size,
        questionsSolved,
        averageAccuracy,
        submissions: userSubmissions,
      };
    }
  );

  // Sort users by total score in descending order
  return userStats.sort((a, b) => b.totalScore - a.totalScore);
};
