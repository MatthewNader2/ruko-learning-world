// src/hooks/useRukoEmotion.ts
import { useState, useCallback, useRef } from "react";

type Emotion =
  | "happy"
  | "sad"
  | "angry"
  | "excited"
  | "thinking"
  | "listening"
  | "celebrating"
  | "crying"
  | "curious"
  | "sleepy";

interface UseRukoEmotionReturn {
  emotion: Emotion;
  setEmotion: (emotion: Emotion) => void;
  triggerRandomEmotion: () => void;
  celebrate: () => void;
  reactToSuccess: () => void;
  reactToFailure: () => void;
}

const EMOTIONS: Emotion[] = [
  "happy",
  "sad",
  "angry",
  "excited",
  "thinking",
  "listening",
  "celebrating",
  "crying",
  "curious",
  "sleepy",
];

export function useRukoEmotion(
  initialEmotion: Emotion = "happy",
): UseRukoEmotionReturn {
  const [emotion, setEmotionState] = useState<Emotion>(initialEmotion);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setEmotion = useCallback((newEmotion: Emotion, duration?: number) => {
    setEmotionState(newEmotion);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (duration) {
      timeoutRef.current = setTimeout(() => {
        setEmotionState("happy");
      }, duration);
    }
  }, []);

  const triggerRandomEmotion = useCallback(() => {
    const randomEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
    setEmotion(randomEmotion, 3000);
  }, [setEmotion]);

  const celebrate = useCallback(() => {
    setEmotion("celebrating", 2000);
  }, [setEmotion]);

  const reactToSuccess = useCallback(() => {
    setEmotion("excited", 1500);
  }, [setEmotion]);

  const reactToFailure = useCallback(() => {
    setEmotion("sad", 1500);
  }, [setEmotion]);

  return {
    emotion,
    setEmotion,
    triggerRandomEmotion,
    celebrate,
    reactToSuccess,
    reactToFailure,
  };
}
