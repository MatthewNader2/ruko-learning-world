// src/services/ai/chatAI.web.ts

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  emotion?: 'happy' | 'thinking' | 'excited' | 'sad';
}

export interface ChatContext {
  className: 'science' | 'coding' | 'history';
  currentTopic?: string;
  recentLessons: string[];
  userAge: number;
  userLevel: number;
  conversationHistory: ChatMessage[];
}

// Mock responses for web
const getMockResponse = (message: string, className: string): string => {
  const messageLower = message.toLowerCase();

  // Science responses
  if (className === 'science') {
    if (messageLower.includes('why') && messageLower.includes('sky')) {
      return "The sky is blue because of how sunlight bounces around in the air! The blue light scatters more than other colors. Pretty cool, right? 🌤️";
    }
    if (messageLower.includes('plant')) {
      return "Plants are like little factories! They use sunlight, water, and air to make their own food. It's called photosynthesis! 🌱";
    }
    if (messageLower.includes('star')) {
      return "Stars are giant balls of super hot gas! Our sun is a star too. They shine by burning hydrogen gas! ⭐";
    }
  }

  // Coding responses
  if (className === 'coding') {
    if (messageLower.includes('what') && messageLower.includes('coding')) {
      return "Coding is like giving instructions to a computer! You tell it what to do step by step, and it follows your commands. It's like teaching a robot to dance! 💻";
    }
    if (messageLower.includes('game')) {
      return "Making games is so fun! You code the rules, the characters, and what happens when you play. Many game makers started when they were your age! 🎮";
    }
  }

  // History responses
  if (className === 'history') {
    if (messageLower.includes('dinosaur')) {
      return "Dinosaurs lived millions of years ago! They were real animals that ruled the Earth before humans existed. Cool, right? 🦕";
    }
    if (messageLower.includes('pyramid')) {
      return "Ancient Egyptians built pyramids as giant tombs! They used simple tools but were super smart about math and engineering! 🏛️";
    }
  }

  // Generic friendly responses
  return "That's a great question! I love your curiosity! Keep asking me things - that's how we learn together! 🤖✨";
};

export const getSuggestedQuestions = (context: ChatContext): string[] => {
  const suggestions = {
    science: [
      "Why is the sky blue? 🌤️",
      "How do plants eat?",
      "What are stars made of? ⭐",
      "Why do we need to sleep?",
      "How do birds fly? 🦅"
    ],
    coding: [
      "What is coding? 💻",
      "How do I make a game?",
      "What's a variable?",
      "Can I code on my phone? 📱",
      "How do apps work?"
    ],
    history: [
      "Who invented the wheel? 🛞",
      "How did people write long ago?",
      "What did kids play with in the past? 🎮",
      "Who was the first astronaut? 🚀",
      "How were pyramids built?"
    ]
  };

  return suggestions[context.className] || [];
};

export const sendChatMessage = async (
  message: string,
  context: ChatContext
): Promise<{ response: string; emotion: ChatMessage['emotion'] }> => {
  console.log('[WEB MODE] Mock chat response');

  await new Promise(resolve => setTimeout(resolve, 500));

  const response = getMockResponse(message, context.className);

  // Determine emotion
  let emotion: ChatMessage['emotion'] = 'happy';
  if (message.toLowerCase().includes('why') || message.toLowerCase().includes('how')) {
    emotion = 'thinking';
  }
  if (response.includes('!')) {
    emotion = 'excited';
  }

  return { response, emotion };
};

export const explainTopic = async (
  topic: string,
  context: ChatContext,
  depth: 'simple' | 'detailed' = 'simple'
): Promise<string> => {
  console.log('[WEB MODE] Mock explanation');

  await new Promise(resolve => setTimeout(resolve, 400));

  return `${topic} is really interesting! It's all about how things work and why they happen. Want to learn more about it? 🤔`;
};

export const getFunFact = async (
  context: ChatContext
): Promise<string> => {
  console.log('[WEB MODE] Mock fun fact');

  await new Promise(resolve => setTimeout(resolve, 300));

  const facts = {
    science: "Did you know a single tree can produce enough oxygen for 2 people? Trees are like Earth's air factories! 🌳",
    coding: "Did you know the first computer programmer was a woman named Ada Lovelace in 1843? She wrote code before computers even existed! 💻",
    history: "Did you know ancient Egyptians invented toothpaste? They used crushed eggshells and animal hooves! 🦷"
  };

  return facts[context.className] || "Learning is an adventure! 🌟";
};

export const handleFollowUp = async (
  originalQuestion: string,
  followUpQuestion: string,
  originalAnswer: string,
  context: ChatContext
): Promise<string> => {
  console.log('[WEB MODE] Mock follow-up');

  await new Promise(resolve => setTimeout(resolve, 400));

  return "Great follow-up question! You're really thinking deeply about this! 🧠";
};

export const checkMessageSafety = (message: string): { safe: boolean; reason?: string } => {
  return { safe: true };
};

export const getConversationStarters = (context: ChatContext): string[] => {
  const starters = {
    science: [
      "Tell me something amazing about space! 🚀",
      "How does my brain work?",
      "Why do we have different seasons?",
      "What's the biggest animal ever?",
      "How do magnets work?"
    ],
    coding: [
      "What's the first thing I should learn?",
      "Can I make my own game?",
      "How does a computer think?",
      "What language should I start with?",
      "How do robots work? 🤖"
    ],
    history: [
      "What was life like 100 years ago?",
      "Who was the first person to fly?",
      "How did people communicate long ago?",
      "What did ancient kids do for fun?",
      "When was the internet invented?"
    ]
  };

  return starters[context.className] || [];
};
