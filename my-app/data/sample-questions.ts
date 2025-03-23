import type { Question } from "../types";

export const questions: Question[] = [
  {
    id: 1,
    title: "Two Sum",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers in the array such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    difficulty: "Easy",
    requirements: [
      "Return the indices of two numbers that add up to the target",
      "Each input has exactly one solution",
      "The same element cannot be used twice",
      "Return the answer in any order",
    ],
    testCases: [1],
    sampleInput: "nums = [2,7,11,15], target = 9",
    sampleOutput: "[0,1] // Because nums[0] + nums[1] == 9",
    constraints: [
      "2 <= nums.length <= 104",
      "-109 <= nums[i] <= 109",
      "-109 <= target <= 109",
    ],
  },
  {
    id: 2,
    title: "Longest Palindromic Substring",
    description:
      "Given a string s, return the longest palindromic substring in s. A string is called a palindrome if it reads the same backward as forward.",
    difficulty: "Medium",
    requirements: [
      "Find and return the longest substring that is a palindrome",
      "Handle both odd and even length palindromes",
      "Return the first occurrence if multiple solutions exist",
    ],
    testCases: [2],
    sampleInput: "s = 'babad'",
    sampleOutput: "'bab' // Note that 'aba' is also a valid answer",
    constraints: [
      "1 <= s.length <= 1000",
      "s consist of only digits and English letters",
    ],
  },
  {
    id: 3,
    title: "Median of Two Sorted Arrays",
    description:
      "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
    difficulty: "Hard",
    requirements: [
      "Find the median of two sorted arrays",
      "Achieve O(log (m+n)) time complexity",
      "Handle both even and odd total lengths",
      "Return the median as a floating point number",
    ],
    testCases: [3],
    sampleInput: "nums1 = [1,3], nums2 = [2]",
    sampleOutput: "2.0 // Merged array = [1,2,3] and median is 2",
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-106 <= nums1[i], nums2[i] <= 106",
    ],
  },
];
