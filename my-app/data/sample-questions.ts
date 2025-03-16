import type { Question } from "../types"

export const questions: Question[] = [
  {
    id: 1,
    title: "GPT Whisperer: Craft the Perfect Prompt",
    description:
      "Master the art of prompt engineering by creating a meta-prompt that generates highly effective prompts for various tasks.",
    difficulty: "Hard",
    requirements: [
      "Design a prompt that can generate task-specific prompts",
      "Include parameters for adjusting tone, style, and complexity",
      "Ensure generated prompts are clear, concise, and effective",
      "Handle a wide range of tasks (e.g., writing, coding, analysis)",
    ],
    testCases: [1],
  },
  {
    id: 2,
    title: "Simple Weather Chatbot",
    description: "Create a basic chatbot that can respond to weather-related queries.",
    difficulty: "Easy",
    requirements: [
      "Handle basic questions about temperature, precipitation, and wind",
      "Provide responses for at least three different cities",
      "Use a friendly and conversational tone",
    ],
    testCases: [2],
  },
  {
    id: 3,
    title: "AI Debate Moderator: Balancing Perspectives",
    description:
      "Develop an AI moderator that can facilitate a balanced debate on controversial topics, ensuring fair representation of different viewpoints.",
    difficulty: "Medium",
    requirements: [
      "Create prompts for an AI to moderate debates on sensitive topics",
      "Ensure equal speaking time and representation for all sides",
      "Implement fact-checking and bias detection mechanisms",
      "Generate thought-provoking questions to deepen the discussion",
    ],
    testCases: [3],
  },
  {
    id: 4,
    title: "Friendly Greeting Generator",
    description: "Create a prompt that generates friendly greetings based on the time of day and user's name.",
    difficulty: "Easy",
    requirements: [
      "Generate greetings for morning, afternoon, evening, and night",
      "Incorporate the user's name into the greeting",
      "Add a simple, positive message to each greeting",
    ],
    testCases: [4],
  },
  {
    id: 5,
    title: "Emotional Intelligence Enhancer",
    description:
      "Design a prompt that improves the emotional intelligence of AI responses, making them more empathetic and context-aware.",
    difficulty: "Medium",
    requirements: [
      "Create a system for detecting emotional context in user inputs",
      "Develop prompts that generate emotionally appropriate responses",
      "Include mechanisms for handling complex or mixed emotions",
      "Ensure responses are supportive and non-judgmental",
    ],
    testCases: [5],
  },
  {
    id: 6,
    title: "Multimodal Mastermind: Text-to-Image Prompt Wizard",
    description:
      "Craft a prompt that generates optimal text-to-image prompts for AI art generators like DALL-E or Midjourney.",
    difficulty: "Hard",
    requirements: [
      "Create a system for translating abstract concepts into vivid, detailed image descriptions",
      "Include parameters for style, mood, composition, and artistic reference",
      "Optimize prompts for different AI art generators' strengths and limitations",
      "Implement a mechanism for iterative refinement based on generated results",
    ],
    testCases: [6],
  },
  {
    id: 7,
    title: "Basic Text Summarizer",
    description: "Design a prompt for a simple text summarization tool.",
    difficulty: "Easy",
    requirements: [
      "Summarize text in 2-3 sentences",
      "Maintain key points from the original text",
      "Handle inputs of varying lengths (50-500 words)",
    ],
    testCases: [7],
  },
  {
    id: 8,
    title: "AI Storyteller: Interactive Narrative Generator",
    description:
      "Create a prompt system for generating interactive, branching narratives that respond to user choices.",
    difficulty: "Medium",
    requirements: [
      "Design a framework for creating coherent, branching storylines",
      "Implement a system for tracking and incorporating user choices",
      "Ensure narrative consistency across different paths",
      "Include mechanisms for generating diverse genres and plot twists",
    ],
    testCases: [8],
  },
  {
    id: 9,
    title: "Ethical AI Guardian",
    description:
      "Develop a prompt that acts as an ethical oversight system for AI responses, ensuring outputs adhere to moral and social standards.",
    difficulty: "Hard",
    requirements: [
      "Create a comprehensive ethical framework for AI decision-making",
      "Implement checks for bias, discrimination, and potential harm",
      "Design a system for explaining ethical considerations in AI outputs",
      "Include mechanisms for handling complex ethical dilemmas",
    ],
    testCases: [9],
  },
  {
    id: 10,
    title: "AI Tutor: Personalized Learning Companion",
    description:
      "Design an adaptive AI tutor that can explain complex concepts in a way tailored to individual learning styles and prior knowledge.",
    difficulty: "Medium",
    requirements: [
      "Create a system for assessing a user's learning style and knowledge level",
      "Develop prompts that explain concepts using appropriate analogies and examples",
      "Implement a mechanism for breaking down complex topics into manageable chunks",
      "Include interactive elements like quizzes and practical exercises",
    ],
    testCases: [10],
  },
  {
    id: 11,
    title: "Cultural Context Adapter",
    description:
      "Craft a prompt system that adapts AI responses to be culturally appropriate and sensitive across different global contexts.",
    difficulty: "Hard",
    requirements: [
      "Develop a framework for understanding and applying cultural nuances",
      "Create prompts that generate culturally respectful and relevant content",
      "Implement checks for cultural appropriation and stereotyping",
      "Include mechanisms for handling culture-specific idioms and references",
    ],
    testCases: [11],
  },
  {
    id: 12,
    title: "Sci-Fi Tech Conceptualizer",
    description:
      "Create a prompt that generates scientifically plausible concepts for futuristic technologies based on current scientific trends.",
    difficulty: "Medium",
    requirements: [
      "Develop a system for extrapolating current technologies into future possibilities",
      "Ensure concepts are grounded in real scientific principles",
      "Include potential societal impacts and ethical considerations",
      "Generate detailed descriptions of how the technology might work",
    ],
    testCases: [12],
  },
  {
    id: 13,
    title: "AI Creativity Booster",
    description:
      "Design a prompt system that enhances the creative output of AI, generating novel ideas and connections across diverse fields.",
    difficulty: "Hard",
    requirements: [
      "Develop mechanisms for combining disparate concepts in meaningful ways",
      "Implement techniques for breaking conventional thinking patterns",
      "Create prompts that encourage exploration of unconventional solutions",
      "Include methods for evaluating and refining creative outputs",
    ],
    testCases: [13],
  },
]


