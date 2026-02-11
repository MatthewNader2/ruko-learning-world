// services/gemini.ts
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export const generateGeminiResponse = async (prompt: string) => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing in .env");
  }

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Gemini API Error");
    }

    const data = await response.json();
    // Safely extract the text
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

  } catch (error) {
    console.error("Gemini API Call Failed:", error);
    return "Error connecting to AI.";
  }
};
