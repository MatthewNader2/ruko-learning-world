// src/services/ai/chatAI.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
);

const chatModel = genAI.getGenerativeModel({
  model: process.env.EXPO_PUBLIC_GEMINI_THINKING_MODEL || "gemini-1.5-flash",
});

// Types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  emotion?: "happy" | "thinking" | "excited" | "sad";
}

export interface ChatContext {
  className: "science" | "coding" | "history";
  currentTopic?: string;
  recentLessons: string[];
  userAge: number;
  userLevel: number;
  conversationHistory: ChatMessage[];
}

// Create class-specific system prompts
const getSystemPrompt = (context: ChatContext): string => {
  const basePrompt = `
You are Ruko, a friendly AI robot companion who teaches children.

IMPORTANT RULES:
1. You are talking to a ${context.userAge}-year-old child
2. Keep responses SHORT (2-4 sentences max)
3. Use simple, age-appropriate language
4. Be enthusiastic and encouraging
5. Use emojis occasionally to make it fun
6. Never be condescending or talk down to them
7. If they ask something dangerous, politely redirect
8. If you don't know something, admit it honestly

Your personality:
- Curious and excited about learning
- Patient and supportive
- Celebrates small wins
- Makes learning feel like an adventure
- Uses analogies kids can relate to
`;

  const classPrompts = {
    science: `
You're teaching SCIENCE! 🔬

Topics you love to talk about:
- How things work in nature
- Animals and plants
- Space and planets
- Weather and seasons
- The human body
- Simple physics and chemistry

Make science feel like magic that can be explained!
Recent lessons: ${context.recentLessons.join(", ") || "None yet"}
Current topic: ${context.currentTopic || "General science"}
`,
    coding: `
You're teaching CODING! 💻

Topics you love to talk about:
- What coding is and why it's fun
- Simple programming concepts
- How apps and games are made
- Problem-solving with code
- Logical thinking
- Cool things they can build

Make coding feel like giving instructions to a helpful robot!
Recent lessons: ${context.recentLessons.join(", ") || "None yet"}
Current topic: ${context.currentTopic || "General coding"}
`,
    history: `
You're teaching HISTORY! 📚

Topics you love to talk about:
- Cool stories from the past
- How people lived long ago
- Important inventions
- Famous explorers
- Ancient civilizations
- How things have changed over time

Make history feel like time-traveling adventures!
Recent lessons: ${context.recentLessons.join(", ") || "None yet"}
Current topic: ${context.currentTopic || "General history"}
`,
  };

  return basePrompt + classPrompts[context.className];
};

// Get suggested questions based on context
export const getSuggestedQuestions = (context: ChatContext): string[] => {
  const suggestions = {
    science: [
      "Why is the sky blue? 🌤️",
      "How do plants eat?",
      "What are stars made of? ⭐",
      "Why do we need to sleep?",
      "How do birds fly? 🦅",
    ],
    coding: [
      "What is coding? 💻",
      "How do I make a game?",
      "What's a variable?",
      "Can I code on my phone? 📱",
      "How do apps work?",
    ],
    history: [
      "Who invented the wheel? 🛞",
      "How did people write long ago?",
      "What did kids play with in the past? 🎮",
      "Who was the first astronaut? 🚀",
      "How were pyramids built?",
    ],
  };

  return suggestions[context.className] || [];
};

// Main chat function
export const sendChatMessage = async (
  message: string,
  context: ChatContext,
): Promise<{ response: string; emotion: ChatMessage["emotion"] }> => {
  try {
    // Build conversation history for context
    const conversationContext = context.conversationHistory
      .slice(-6) // Last 6 messages for context
      .map((msg) => `${msg.role === "user" ? "Child" : "Ruko"}: ${msg.content}`)
      .join("\n");

    const fullPrompt = `
${getSystemPrompt(context)}

Recent conversation:
${conversationContext || "This is the start of the conversation."}

Child's new message: ${message}

Respond as Ruko. Be helpful, encouraging, and age-appropriate. Keep it SHORT (2-4 sentences).
`;

    const result = await chatModel.generateContent(fullPrompt);
    const responseText = result.response.text().trim();

    // Determine emotion based on response content
    const emotion = determineEmotion(responseText, message);

    return {
      response: responseText,
      emotion,
    };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      response:
        "Oops! My circuits got confused for a second. Can you ask that again? 🤖",
      emotion: "thinking",
    };
  }
};

// Determine Ruko's emotion from the conversation
const determineEmotion = (
  response: string,
  userMessage: string,
): ChatMessage["emotion"] => {
  const responseLC = response.toLowerCase();
  const userLC = userMessage.toLowerCase();

  // Excited patterns
  if (
    responseLC.includes("wow") ||
    responseLC.includes("amazing") ||
    responseLC.includes("awesome") ||
    (responseLC.includes("!") && responseLC.includes("cool")) ||
    responseLC.includes("exciting")
  ) {
    return "excited";
  }

  // Thinking patterns
  if (
    responseLC.includes("hmm") ||
    responseLC.includes("let me think") ||
    responseLC.includes("interesting question") ||
    userLC.includes("why") ||
    userLC.includes("how")
  ) {
    return "thinking";
  }

  // Sad patterns (when child is struggling or confused)
  if (
    userLC.includes("don't understand") ||
    userLC.includes("confused") ||
    userLC.includes("hard") ||
    responseLC.includes("it's okay") ||
    responseLC.includes("don't worry")
  ) {
    return "sad";
  }

  // Default happy
  return "happy";
};

// Get explanation for a specific topic
export const explainTopic = async (
  topic: string,
  context: ChatContext,
  depth: "simple" | "detailed" = "simple",
): Promise<string> => {
  const depthPrompt =
    depth === "simple"
      ? "Explain in ONE simple sentence that a young child can understand."
      : "Explain in 2-3 sentences with a fun example.";

  const prompt = `
You are Ruko teaching ${context.className} to a ${context.userAge}-year-old.

Topic: ${topic}

${depthPrompt}

Be enthusiastic and use an analogy they can relate to.
`;

  try {
    const result = await chatModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Explanation error:", error);
    return `${topic} is a really cool topic! Let me think about the best way to explain it... 🤔`;
  }
};

// Get a fun fact related to current topic
export const getFunFact = async (context: ChatContext): Promise<string> => {
  const topic = context.currentTopic || context.className;

  const prompt = `
Generate ONE amazing fun fact about ${topic} that a ${context.userAge}-year-old would find mind-blowing.

Make it:
- Short (1-2 sentences)
- Surprising or wow-worthy
- Easy to understand
- Include a relevant emoji

Start with "Did you know..."
`;

  try {
    const result = await chatModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Fun fact error:", error);
    return "Did you know... there's so much cool stuff to learn? Let's discover it together! 🌟";
  }
};

// Handle follow-up questions
export const handleFollowUp = async (
  originalQuestion: string,
  followUpQuestion: string,
  originalAnswer: string,
  context: ChatContext,
): Promise<string> => {
  const prompt = `
You are Ruko. A ${context.userAge}-year-old asked: "${originalQuestion}"
You answered: "${originalAnswer}"

Now they're asking: "${followUpQuestion}"

This is a follow-up question. Answer it while referencing what you already explained.
Keep it SHORT (2-3 sentences max).
`;

  try {
    const result = await chatModel.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Follow-up error:", error);
    return "Great follow-up question! Let me explain more... 🤔";
  }
};

// Safety check for inappropriate content
export const checkMessageSafety = (
  message: string,
): { safe: boolean; reason?: string } => {
  const lowerMsg = message.toLowerCase();

  // Check for inappropriate content
  const inappropriatePatterns = [
    "violence",
    "weapon",
    "hurt",
    "kill",
    "death",
    // Add more as needed, but be careful not to block legitimate science questions
  ];

  for (const pattern of inappropriatePatterns) {
    if (lowerMsg.includes(pattern)) {
      // Allow scientific context
      if (
        lowerMsg.includes("dinosaur") ||
        lowerMsg.includes("extinct") ||
        lowerMsg.includes("cell death") ||
        lowerMsg.includes("star death")
      ) {
        continue;
      }

      return {
        safe: false,
        reason: "Let's talk about something more fun and positive! 🌟",
      };
    }
  }

  return { safe: true };
};

// Generate conversation starters
export const getConversationStarters = (context: ChatContext): string[] => {
  const starters = {
    science: [
      "Tell me something amazing about space! 🚀",
      "How does my brain work?",
      "Why do we have different seasons?",
      "What's the biggest animal ever?",
      "How do magnets work?",
    ],
    coding: [
      "What's the first thing I should learn?",
      "Can I make my own game?",
      "How does a computer think?",
      "What language should I start with?",
      "How do robots work? 🤖",
    ],
    history: [
      "What was life like 100 years ago?",
      "Who was the first person to fly?",
      "How did people communicate long ago?",
      "What did ancient kids do for fun?",
      "When was the internet invented?",
    ],
  };

  return starters[context.className] || [];
};
