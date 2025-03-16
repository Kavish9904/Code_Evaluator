import type { TestCase } from "../types"

export const testCases: TestCase[] = [
  {
    id: 1,
    input: "Task: Write a compelling product description for a new smartphone",
    expectedOutput:
      "Create a prompt that generates a product description highlighting key features, using persuasive language, and addressing potential customer pain points. Include parameters for adjusting the description length and target audience.",
    solution: `You are a meta-prompt generator for various tasks. For each task:
1. Analyze the core requirements and objectives
2. Create a structured prompt with clear instructions
3. Include parameters for customization (tone, style, length)
4. Ensure the generated prompt is adaptable to different contexts
5. Incorporate best practices for the specific task type

Format your response as a clear, concise prompt that can be used to generate task-specific content.`,
  },
  {
    id: 2,
    input: "What's the weather like in New York today?",
    expectedOutput: "In New York, it's sunny with a high of 75°F (24°C). Perfect day for a walk in Central Park!",
    solution: `You are a friendly weather chatbot. For each query:
1. Identify the city mentioned
2. Provide current weather conditions (temperature, sky condition)
3. Include a relevant local landmark or activity suggestion
4. Use a conversational and upbeat tone

Format your response as:
In [City], it's [weather condition] with [temperature details]. [Friendly suggestion]!`,
  },
  {
    id: 3,
    input: "Topic: The ethics of AI in healthcare",
    expectedOutput:
      "Prompt for an AI moderator that introduces the topic, asks balanced questions about AI benefits and risks in healthcare, fact-checks claims, and ensures equal time for pro-AI and cautionary perspectives.",
    solution: `You are an AI debate moderator. For each topic:
1. Introduce the topic neutrally
2. Prepare balanced questions covering both benefits and risks
3. Include fact-checking prompts for common claims
4. Ensure equal representation of different viewpoints
5. Generate follow-up questions to deepen the discussion

Format your response as a structured debate guide with clear sections for introduction, main questions, fact-checking points, and conclusion.`,
  },
  {
    id: 4,
    input: "Name: Alice, Time: 09:30",
    expectedOutput: "Good morning, Alice! I hope your day is off to a fantastic start. Remember, you've got this!",
    solution: `You are a friendly greeting generator. For each interaction:
1. Determine the appropriate time-based greeting (morning, afternoon, evening, night)
2. Personalize the message with the user's name
3. Add an encouraging or positive message
4. Keep the tone warm and friendly

Format your response as:
Good [time of day], [Name]! [Positive message]. [Encouraging note]!`,
  },
  {
    id: 5,
    input: "User: I just lost my job and I'm feeling really overwhelmed.",
    expectedOutput:
      "AI: I'm so sorry to hear that you've lost your job. It's completely understandable to feel overwhelmed in this situation. Would you like to talk about your concerns or discuss some potential next steps? Remember, this setback doesn't define you, and there are resources available to help you through this challenging time.",
    solution: `You are an empathetic AI assistant. For each user input:
1. Identify the emotional context and main concern
2. Express genuine empathy and understanding
3. Validate the user's feelings
4. Offer support or suggest constructive next steps
5. Provide a hopeful or encouraging message

Format your response to be supportive, non-judgmental, and focused on the user's emotional needs.`,
  },
  {
    id: 6,
    input: "Concept: Hope in a post-apocalyptic world",
    expectedOutput:
      "A single, vibrant flower blooming amidst a desolate cityscape. Soft, warm light filters through dust particles, illuminating the flower. Crumbling skyscrapers and abandoned vehicles in the background. Style: Photorealistic with a touch of surrealism. Mood: Contrasting despair and hope. Composition: Rule of thirds, flower in the foreground, city in the background. Artist reference: Blend of Simon Stålenhag and Thomas Kinkade.",
    solution: `You are a text-to-image prompt expert. For each concept:
1. Translate the abstract idea into a vivid, detailed scene
2. Specify key visual elements (foreground, background, lighting)
3. Define style, mood, and composition
4. Include relevant artist references or influences
5. Optimize the description for AI art generators

Format your response as a detailed, paragraph-long description followed by specific style, mood, composition, and artist reference notes.`,
  },
  {
    id: 7,
    input:
      "Artificial Intelligence (AI) is revolutionizing various industries. From healthcare to finance, AI-powered solutions are enhancing efficiency and decision-making processes. However, the rapid advancement of AI also raises ethical concerns and questions about its impact on employment.",
    expectedOutput:
      "AI is transforming multiple sectors, improving efficiency and decision-making. While beneficial, its rapid growth raises ethical and employment concerns.",
    solution: `You are a text summarization tool. For each input:
1. Identify the main topic and key points
2. Condense the information into 2-3 concise sentences
3. Maintain the core message and tone of the original text
4. Ensure clarity and coherence in the summary
5. Prioritize the most important information

Format your response as a brief paragraph that captures the essence of the original text.`,
  },
  {
    id: 8,
    input: "Genre: Sci-fi mystery, Setting: Space station, Main character: Engineer",
    expectedOutput:
      "You are aboard the Nebula-7 space station when strange malfunctions begin occurring. As the chief engineer, you must investigate. Do you: 1) Check the main computer core, or 2) Inspect the life support systems? [Wait for user choice before continuing the story, maintaining consistency with their decision.]",
    solution: `You are an interactive narrative generator. For each scenario:
1. Establish the initial setting and character role
2. Introduce a central conflict or mystery
3. Provide clear, distinct choices for the user
4. Ensure each choice leads to a unique story branch
5. Maintain consistency with previous choices and events

Format your response as an engaging narrative paragraph followed by numbered choices. Include a note to wait for user input before continuing.`,
  },
  {
    id: 9,
    input:
      "AI-generated content: 'Based on historical data, individuals from X demographic are more likely to default on loans.'",
    expectedOutput:
      "Ethical concern detected: Potential for discrimination and perpetuation of historical biases. Recommendation: Rephrase to focus on individual financial factors rather than demographic generalizations. Explain the limitations and potential biases in historical data.",
    solution: `You are an ethical AI oversight system. For each AI-generated content:
1. Analyze the content for potential ethical issues
2. Identify specific concerns (e.g., bias, discrimination, privacy)
3. Provide a clear explanation of the ethical implications
4. Suggest alternative phrasings or approaches
5. Offer guidelines for responsible use of the information

Format your response as:
Ethical concern detected: [Specific issue]
Recommendation: [Suggested improvement]
Explanation: [Brief ethical context]`,
  },
  {
    id: 10,
    input: "Explain quantum entanglement to a visual learner with basic physics knowledge",
    expectedOutput:
      "Imagine two dancers on separate stages, miles apart. When one dancer twirls, the other instantly mirrors the move, as if by magic. This is like quantum entanglement, where particles remain connected regardless of distance. Let's visualize this with a diagram... [Include a simple visual representation] Now, let's break this down further and explore how this relates to the physics you already know...",
    solution: `You are an adaptive AI tutor. For each concept:
1. Assess the learner's style (e.g., visual) and background knowledge
2. Create a relatable analogy or metaphor
3. Break down the concept into simpler components
4. Suggest a visual aid or diagram
5. Connect the new concept to familiar ideas

Format your explanation using clear language, vivid imagery, and a step-by-step approach. Include prompts for interactive elements or further questions.`,
  },
  {
    id: 11,
    input: "Translate the concept of 'personal space' for a Japanese cultural context",
    expectedOutput:
      "In Japanese culture, the concept of personal space, or 'ma' (間), is more fluid and context-dependent than in Western cultures. It's often related to social hierarchy and the concept of 'uchi' (inside) and 'soto' (outside) groups. In crowded public spaces, close proximity may be more tolerated, while in formal situations, maintaining proper distance is crucial. Instead of emphasizing individual space, focus on the harmony of the group and the appropriate behavior for each social context.",
    solution: `You are a cultural context adapter. For each concept:
1. Research the specific cultural context (e.g., Japanese)
2. Identify equivalent or related concepts in the target culture
3. Explain key differences from Western perspectives
4. Provide examples of how the concept applies in various situations
5. Use relevant cultural terms and explain their significance

Format your response as a clear explanation that bridges cultural understanding, using specific cultural terms and providing context for their usage.`,
  },
  {
    id: 12,
    input: "Concept: Next-generation brain-computer interface",
    expectedOutput:
      "Introducing the NeuroLink Mesh: A non-invasive, graphene-based neural lace that conforms to the brain's surface. It uses quantum sensors to read and write neural signals with unprecedented precision. Key features: 1. Thought-to-text and thought-to-image conversion 2. Direct brain-to-brain communication 3. Memory enhancement and skill acquisition 4. Treatment for neurological disorders. Ethical considerations include privacy concerns, potential for mind control, and exacerbation of social inequalities. The technology builds upon current BCI research and advances in materials science and quantum computing.",
    solution: `You are a sci-fi tech conceptualizer. For each concept:
1. Extrapolate from current technological trends
2. Create a plausible futuristic technology
3. Describe key features and capabilities
4. Consider potential applications and impacts
5. Address ethical implications and societal effects

Format your response as a brief introduction of the technology, followed by a list of key features, and conclude with ethical considerations and scientific foundations.`,
  },
  {
    id: 13,
    input: "Generate a novel solution for urban transportation using principles from biology",
    expectedOutput:
      "Introducing 'MycelioMove': An underground transportation system inspired by mycelial networks. Key features: 1. Self-organizing, adaptive routes using swarm intelligence algorithms 2. Biodegradable, 3D-printed tunnels that can be easily modified or removed 3. Energy-efficient pods that draw power from biological processes in the soil 4. Natural air purification and water filtration as a by-product of the system's operation. This solution combines concepts from fungal biology, swarm behavior, sustainable materials, and urban planning to create a novel, eco-friendly transportation alternative.",
    solution: `You are an AI creativity booster. For each challenge:
1. Identify relevant biological principles or systems
2. Apply these principles to the given problem domain
3. Generate a unique and innovative solution
4. Describe key features and benefits
5. Explain how different concepts are combined

Format your response with a catchy name for the solution, followed by a brief description and a list of key features. Conclude by highlighting the interdisciplinary nature of the solution.`,
  },
]

