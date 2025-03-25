import { Submission } from "../types";

interface UserStats {
  username: string;
  totalScore: number;
  submissions: number;
  averageScore: number;
  rank: number;
}

export function calculateUserStats(submissions: Submission[]): UserStats[] {
  // Group submissions by user
  const userSubmissions = submissions.reduce((acc, submission) => {
    const { username } = submission;
    if (!acc[username]) {
      acc[username] = [];
    }
    acc[username].push(submission);
    return acc;
  }, {} as Record<string, Submission[]>);

  // Calculate stats for each user
  const stats = Object.entries(userSubmissions).map(([username, userSubs]) => {
    // Calculate total score based on student-AI score differences
    const totalScore = userSubs.reduce((sum, sub) => {
      const scoreDiff = Math.abs(sub.studentScore - sub.aiScore);
      // Higher score for better accuracy (smaller difference)
      return sum + (100 - scoreDiff);
    }, 0);

    // Calculate accuracy as percentage of perfect matches
    const perfectMatches = userSubs.filter(
      (sub) => Math.abs(sub.studentScore - sub.aiScore) === 0
    ).length;
    const accuracyPercentage = (perfectMatches / userSubs.length) * 100;

    return {
      username,
      totalScore,
      submissions: userSubs.length,
      averageScore: accuracyPercentage,
      rank: 0, // Will be set later
    };
  });

  // Sort by total score and assign ranks
  return stats
    .sort((a, b) => {
      // First sort by total score
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // If total scores are equal, sort by accuracy
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      // If accuracy is equal, sort by number of submissions (more submissions = higher rank)
      return b.submissions - a.submissions;
    })
    .map((stat, index) => ({
      ...stat,
      rank: index + 1,
    }));
}
