import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserState {
  name: string;
  age: number;
  interests: string[];
  learningStyle: "visual" | "reading" | "mixed";
  hasCompletedOnboarding: boolean;
  setUserProfile: (
    name: string,
    age: number,
    interests: string[],
    style: "visual" | "reading" | "mixed",
  ) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: "",
      age: 6,
      interests: [],
      learningStyle: "mixed",
      hasCompletedOnboarding: false,

      setUserProfile: (name, age, interests, learningStyle) =>
        set({
          name,
          age,
          interests,
          learningStyle,
          hasCompletedOnboarding: true,
        }),

      reset: () =>
        set({
          name: "",
          age: 6,
          interests: [],
          learningStyle: "mixed",
          hasCompletedOnboarding: false,
        }),
    }),
    {
      name: "ruko-user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
