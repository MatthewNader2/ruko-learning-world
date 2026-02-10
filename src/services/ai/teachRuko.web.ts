// src/services/ai/teachRuko.web.ts

// ⚠️ This file runs ONLY on the Web to prevent the "import.meta" crash.
// The real AI will still work on your Android phone.

export const startTeachingSession = async (topic: string) => {
  console.log("Web AI Mock: startTeachingSession");
  return `(Web Mode) I love ${topic}! Can you tell me more about it?`;
};

export const evaluateExplanation = async (audioBase64: string, topic: string) => {
  console.log("Web AI Mock: evaluateExplanation");
  return "(Web Mode) Wow! That was a great explanation. You are really smart!";
};
