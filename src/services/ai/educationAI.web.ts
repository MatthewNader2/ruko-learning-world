// src/services/ai/educationAI.web.ts

// Web fallback - returns mock data instead of calling real AI
// This prevents import.meta errors on web

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rukoHint: string;
}

export interface PlantingScenario {
  id: string;
  description: string;
  ingredients: {
    hasSun: boolean;
    hasWater: boolean;
    hasCO2: boolean;
  };
  outcome: 'success' | 'partial' | 'fail';
  feedback: string;
  rukoReaction: 'happy' | 'thinking' | 'sad';
}

export interface LessonContent {
  title: string;
  introduction: string;
  keyPoints: string[];
  funFact: string;
  summary: string;
}

// Mock AI responses for web
export const generateQuiz = async (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  userAge: number,
  count: number = 5
): Promise<QuizQuestion[]> => {
  console.log('[WEB MODE] Using mock quiz data');

  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

  return [
    {
      id: 'web-q1',
      question: 'What do plants need to make food?',
      options: [
        '☀️ Sunlight, 💧 Water, 💨 CO₂',
        '🍕 Pizza, 🥤 Soda, 🍰 Cake',
        '🌙 Moonlight, ☕ Coffee, 🎵 Music',
        '⭐ Stars, 🌈 Rainbow, ☁️ Clouds'
      ],
      correctIndex: 0,
      explanation: 'Plants need sunlight for energy, water from the ground, and carbon dioxide (CO₂) from the air!',
      difficulty,
      rukoHint: 'Think about what plants get from the sun, soil, and air!'
    },
    {
      id: 'web-q2',
      question: 'What do plants make during photosynthesis?',
      options: [
        '🍕 Pizza',
        '🍬 Glucose (sugar) & 💨 Oxygen',
        '☁️ Clouds',
        '🌈 Rainbows'
      ],
      correctIndex: 1,
      explanation: 'Plants make glucose (a type of sugar) for their food, and release oxygen that we breathe!',
      difficulty,
      rukoHint: 'Plants make food AND give us something to breathe!'
    }
  ].slice(0, count);
};

export const generatePlantingScenarios = async (
  level: number
): Promise<PlantingScenario[]> => {
  console.log('[WEB MODE] Using mock scenarios');

  await new Promise(resolve => setTimeout(resolve, 500));

  return [
    {
      id: 'web-s1',
      description: 'You gave the plant only water',
      ingredients: { hasSun: false, hasWater: true, hasCO2: false },
      outcome: 'fail',
      feedback: 'Water alone isn\'t enough! Plants need sunlight for energy and CO₂ from air.',
      rukoReaction: 'sad'
    },
    {
      id: 'web-s2',
      description: 'You gave the plant sun and water',
      ingredients: { hasSun: true, hasWater: true, hasCO2: false },
      outcome: 'partial',
      feedback: 'Good start! But plants also need CO₂ from the air.',
      rukoReaction: 'thinking'
    },
    {
      id: 'web-s3',
      description: 'You gave the plant everything!',
      ingredients: { hasSun: true, hasWater: true, hasCO2: true },
      outcome: 'success',
      feedback: 'Perfect! With sun, water, and CO₂, the plant can make its own food!',
      rukoReaction: 'happy'
    }
  ];
};

export const getAIGuidance = async (
  topic: string,
  question: string,
  userAnswer: string,
  correctAnswer: string,
  userAge: number
): Promise<string> => {
  console.log('[WEB MODE] Using mock guidance');

  await new Promise(resolve => setTimeout(resolve, 300));

  return "Good try! Let me explain: " + correctAnswer;
};

export const generateLessonContent = async (
  topic: string,
  userAge: number,
  learningStyle: 'visual' | 'reading' | 'mixed'
): Promise<LessonContent> => {
  console.log('[WEB MODE] Using mock lesson');

  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    title: `Let's Learn About ${topic}!`,
    introduction: `Get ready to discover something amazing!`,
    keyPoints: [
      'Plants are amazing food factories!',
      'They use sunlight, water, and air',
      'We need plants to survive!'
    ],
    funFact: 'One tree can produce enough oxygen for 2 people!',
    summary: 'Plants make food using photosynthesis - how cool is that?'
  };
};

export const getRukoDialogue = async (
  context: string,
  emotion: 'happy' | 'excited' | 'thinking' | 'encouraging',
  userAge: number
): Promise<string> => {
  console.log('[WEB MODE] Using mock dialogue');

  await new Promise(resolve => setTimeout(resolve, 200));

  const dialogues = {
    happy: 'Awesome! You\'re doing great! 🎉',
    excited: 'WOW! This is so cool! Let\'s keep going! ⚡',
    thinking: 'Hmm, let me think about this... 🤔',
    encouraging: 'You can do it! I believe in you! 💪'
  };

  return dialogues[emotion] || 'Let\'s learn together!';
};
