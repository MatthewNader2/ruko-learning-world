// src/services/ai/educationAI.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || ""
);

const model = genAI.getGenerativeModel({
  model: process.env.EXPO_PUBLIC_GEMINI_THINKING_MODEL || "gemini-1.5-flash",
});

// Types
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

// Generate adaptive quiz based on user level and topic
export const generateQuiz = async (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  userAge: number,
  count: number = 5
): Promise<QuizQuestion[]> => {
  const prompt = `
You are Ruko, a friendly AI robot teaching ${topic} to a ${userAge}-year-old child.

Generate ${count} quiz questions about ${topic} at ${difficulty} difficulty level.

Requirements:
1. Age-appropriate language for ${userAge} years old
2. Multiple choice with 4 options each
3. Include fun, wrong answers that teach common misconceptions
4. Provide clear explanations
5. Add a helpful hint from Ruko's perspective

Return ONLY valid JSON array with this exact structure:
[
  {
    "id": "unique-id",
    "question": "Question text?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctIndex": 0,
    "explanation": "Why this is correct...",
    "difficulty": "${difficulty}",
    "rukoHint": "Hint from Ruko..."
  }
]

Make it educational, fun, and engaging!
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const questions: QuizQuestion[] = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    console.error('Quiz generation error:', error);
    // Return fallback questions
    return getFallbackQuiz(topic, difficulty, count);
  }
};

// Generate planting scenarios for photosynthesis game
export const generatePlantingScenarios = async (
  level: number
): Promise<PlantingScenario[]> => {
  const prompt = `
You are Ruko, teaching photosynthesis through interactive scenarios.
Generate 5 different planting scenarios for difficulty level ${level}/10.

Each scenario should have:
- Different combinations of sun, water, and CO2
- Realistic outcomes based on what's provided
- Educational feedback explaining why it worked or didn't
- Ruko's emotional reaction

Return ONLY valid JSON array:
[
  {
    "id": "scenario-id",
    "description": "Child's action description",
    "ingredients": {
      "hasSun": true/false,
      "hasWater": true/false,
      "hasCO2": true/false
    },
    "outcome": "success" | "partial" | "fail",
    "feedback": "Educational explanation",
    "rukoReaction": "happy" | "thinking" | "sad"
  }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Scenario generation error:', error);
    return getFallbackScenarios();
  }
};

// Get AI guidance for wrong answer
export const getAIGuidance = async (
  topic: string,
  question: string,
  userAnswer: string,
  correctAnswer: string,
  userAge: number
): Promise<string> => {
  const prompt = `
You are Ruko, a friendly AI robot teacher.

A ${userAge}-year-old child was learning about ${topic}.
Question: ${question}
Their answer: ${userAnswer}
Correct answer: ${correctAnswer}

Provide encouraging, educational guidance (2-3 sentences max) that:
1. Acknowledges their effort
2. Gently explains the mistake
3. Helps them understand the correct concept
4. Keeps them motivated

Respond as Ruko in first person, friendly tone.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Guidance generation error:', error);
    return "Good try! Let me explain why that's not quite right...";
  }
};

// Generate lesson content
export const generateLessonContent = async (
  topic: string,
  userAge: number,
  learningStyle: 'visual' | 'reading' | 'mixed'
): Promise<LessonContent> => {
  const prompt = `
Create an engaging lesson about ${topic} for a ${userAge}-year-old child.
Their learning style is: ${learningStyle}

Return ONLY valid JSON:
{
  "title": "Engaging title",
  "introduction": "Hook them with excitement",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "funFact": "Amazing fact they'll love",
  "summary": "Quick recap"
}

Make it ${learningStyle === 'visual' ? 'descriptive and visual' : 'clear and informative'}.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Lesson generation error:', error);
    return getFallbackLesson(topic);
  }
};

// Get contextual Ruko dialogue
export const getRukoDialogue = async (
  context: string,
  emotion: 'happy' | 'excited' | 'thinking' | 'encouraging',
  userAge: number
): Promise<string> => {
  const prompt = `
You are Ruko, a friendly robot companion teaching a ${userAge}-year-old child.

Context: ${context}
Your current emotion: ${emotion}

Generate ONE short, age-appropriate response (1-2 sentences max) as Ruko.
Be enthusiastic, encouraging, and educational.

Just the dialogue, no quotation marks or labels.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Dialogue generation error:', error);
    return getDefaultDialogue(emotion);
  }
};

// ===== FALLBACK FUNCTIONS =====

function getFallbackQuiz(topic: string, difficulty: string, count: number): QuizQuestion[] {
  const photosynthesisQuiz: QuizQuestion[] = [
    {
      id: 'photo-1',
      question: 'What do plants need to make food?',
      options: [
        '☀️ Sunlight, 💧 Water, 💨 CO₂',
        '🍕 Pizza, 🥤 Soda, 🍰 Cake',
        '🌙 Moonlight, ☕ Coffee, 🎵 Music',
        '⭐ Stars, 🌈 Rainbow, ☁️ Clouds'
      ],
      correctIndex: 0,
      explanation: 'Plants need sunlight for energy, water from the ground, and carbon dioxide (CO₂) from the air!',
      difficulty: difficulty as any,
      rukoHint: 'Think about what plants get from the sun, soil, and air!'
    },
    {
      id: 'photo-2',
      question: 'What do plants make during photosynthesis?',
      options: [
        '🍕 Pizza',
        '🍬 Glucose (sugar) & 💨 Oxygen',
        '☁️ Clouds',
        '🌈 Rainbows'
      ],
      correctIndex: 1,
      explanation: 'Plants make glucose (a type of sugar) for their food, and release oxygen that we breathe!',
      difficulty: difficulty as any,
      rukoHint: 'Remember: Plants make their own food AND give us something to breathe!'
    },
    {
      id: 'photo-3',
      question: 'Where does photosynthesis happen in a plant?',
      options: [
        '🌿 In the leaves',
        '🪨 In the rocks',
        '☁️ In the clouds',
        '🌊 In the ocean'
      ],
      correctIndex: 0,
      explanation: 'Photosynthesis happens in the leaves! They have special green parts called chlorophyll that catch sunlight.',
      difficulty: difficulty as any,
      rukoHint: 'Think about the green parts of the plant!'
    }
  ];

  return photosynthesisQuiz.slice(0, count);
}

function getFallbackScenarios(): PlantingScenario[] {
  return [
    {
      id: 'scenario-1',
      description: 'You gave the plant only water',
      ingredients: { hasSun: false, hasWater: true, hasCO2: false },
      outcome: 'fail',
      feedback: 'Water alone isn\'t enough! Plants need sunlight for energy and CO₂ from air.',
      rukoReaction: 'sad'
    },
    {
      id: 'scenario-2',
      description: 'You gave the plant sun and water',
      ingredients: { hasSun: true, hasWater: true, hasCO2: false },
      outcome: 'partial',
      feedback: 'Good start! But plants also need CO₂ from the air to complete photosynthesis.',
      rukoReaction: 'thinking'
    },
    {
      id: 'scenario-3',
      description: 'You gave the plant everything!',
      ingredients: { hasSun: true, hasWater: true, hasCO2: true },
      outcome: 'success',
      feedback: 'Perfect! With sun, water, and CO₂, the plant can make its own food!',
      rukoReaction: 'happy'
    }
  ];
}

function getFallbackLesson(topic: string): LessonContent {
  return {
    title: `Let's Learn About ${topic}!`,
    introduction: `Get ready to discover something amazing about ${topic}!`,
    keyPoints: [
      'This is an exciting topic!',
      'You\'re going to learn a lot!',
      'Let\'s explore together!'
    ],
    funFact: 'Did you know learning new things makes your brain stronger?',
    summary: 'Great job learning something new today!'
  };
}

function getDefaultDialogue(emotion: string): string {
  const dialogues = {
    happy: 'Awesome! You\'re doing great! 🎉',
    excited: 'WOW! This is so cool! Let\'s keep going! ⚡',
    thinking: 'Hmm, let me think about this... 🤔',
    encouraging: 'You can do it! I believe in you! 💪'
  };

  return dialogues[emotion as keyof typeof dialogues] || 'Let\'s learn together!';
}
