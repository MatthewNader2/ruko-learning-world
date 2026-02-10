import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
);

// 1. The Thinking Model (Chat/Logic)
const thinkingModel = genAI.getGenerativeModel({
  model: process.env.EXPO_PUBLIC_GEMINI_THINKING_MODEL || "gemini-1.5-flash",
});

// 2. The Audio Model (Multimodal)
const audioModel = genAI.getGenerativeModel({
  model: process.env.EXPO_PUBLIC_GEMINI_AUDIO_MODEL || "gemini-1.5-flash",
});

export const startTeachingSession = async (topic: string) => {
  // Ruko asks the child a question to start
  const prompt = `
    Ask a child to teach you about ${topic}.
    Act like a curious robot named Ruko.
    Keep it short (1 sentence).
  `;
  const result = await thinkingModel.generateContent(prompt);
  return result.response.text();
};

export const evaluateExplanation = async (
  audioBase64: string,
  topic: string,
) => {
  // We send the audio directly to Gemini
  const prompt = `
    You are Ruko. A child is explaining ${topic} to you.
    1. Listen to the audio.
    2. If they are correct, celebrate!
    3. If they are slightly wrong, gently correct them.
    4. If they are silent or unclear, encourage them to try again.
    Reply as Ruko. Keep it simple.
  `;

  const result = await audioModel.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "audio/mp3", // or audio/wav depending on recording
        data: audioBase64,
      },
    },
  ]);

  return result.response.text();
};
