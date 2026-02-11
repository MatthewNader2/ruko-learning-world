import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface UserProfile {
  name: string;
  age: number;
  interests: string[];
  learningStyle: 'visual' | 'reading' | 'mixed';
  avatarColor?: string;
}

export interface LevelProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface ClassProgress {
  classId: string;
  completedLessons: string[];
  currentLesson: string | null;
  quizScores: Record<string, number>; // lessonId -> score
  lastAccessed: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number;
}

export interface GameState {
  // User Profile
  name: string;
  age: number;
  interests: string[];
  learningStyle: 'visual' | 'reading' | 'mixed';
  hasCompletedOnboarding: boolean;

  // Gamification
  level: number;
  xp: number;
  totalXP: number;
  coins: number;

  // Progress Tracking
  scienceProgress: ClassProgress;
  codingProgress: ClassProgress;
  historyProgress: ClassProgress;

  // Achievements & Badges
  achievements: Achievement[];
  badges: string[];

  // Stats
  totalLessonsCompleted: number;
  totalQuizzesPassed: number;
  streakDays: number;
  lastActiveDate: string;

  // Actions
  setUserProfile: (
    name: string,
    age: number,
    interests: string[],
    learningStyle: 'visual' | 'reading' | 'mixed'
  ) => void;

  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;

  updateClassProgress: (
    classId: 'science' | 'coding' | 'history',
    lessonId: string,
    completed: boolean,
    score?: number
  ) => void;

  unlockAchievement: (achievement: Achievement) => void;
  addBadge: (badgeId: string) => void;

  updateStreak: () => void;

  reset: () => void;

  // Persist helper
  persist: {
    clearStorage: () => Promise<void>;
  };
}

// XP calculation helper
const calculateLevelFromXP = (xp: number): number => {
  // Level formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const calculateXPForNextLevel = (currentLevel: number): number => {
  // XP needed for next level: (level + 1)^2 * 100
  return Math.pow(currentLevel + 1, 2) * 100;
};

// Initial states
const initialClassProgress: ClassProgress = {
  classId: '',
  completedLessons: [],
  currentLesson: null,
  quizScores: {},
  lastAccessed: 0,
};

const initialState = {
  name: '',
  age: 0,
  interests: [],
  learningStyle: 'mixed' as const,
  hasCompletedOnboarding: false,

  level: 1,
  xp: 0,
  totalXP: 0,
  coins: 0,

  scienceProgress: { ...initialClassProgress, classId: 'science' },
  codingProgress: { ...initialClassProgress, classId: 'coding' },
  historyProgress: { ...initialClassProgress, classId: 'history' },

  achievements: [],
  badges: [],

  totalLessonsCompleted: 0,
  totalQuizzesPassed: 0,
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

export const useUserStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUserProfile: (name, age, interests, learningStyle) => {
        set({
          name,
          age,
          interests,
          learningStyle,
          hasCompletedOnboarding: true,
        });
      },

      addXP: (amount) => {
        set((state) => {
          const newTotalXP = state.totalXP + amount;
          const newLevel = calculateLevelFromXP(newTotalXP);

          // Check for level up
          const didLevelUp = newLevel > state.level;

          return {
            xp: state.xp + amount,
            totalXP: newTotalXP,
            level: newLevel,
            // Bonus coins on level up
            coins: didLevelUp ? state.coins + (newLevel * 10) : state.coins,
          };
        });
      },

      addCoins: (amount) => {
        set((state) => ({
          coins: state.coins + amount,
        }));
      },

      updateClassProgress: (classId, lessonId, completed, score) => {
        set((state) => {
          const progressKey = `${classId}Progress` as 'scienceProgress' | 'codingProgress' | 'historyProgress';
          const currentProgress = state[progressKey];

          const updatedProgress: ClassProgress = {
            ...currentProgress,
            lastAccessed: Date.now(),
            currentLesson: lessonId,
          };

          if (completed && !currentProgress.completedLessons.includes(lessonId)) {
            updatedProgress.completedLessons = [
              ...currentProgress.completedLessons,
              lessonId,
            ];
          }

          if (score !== undefined) {
            updatedProgress.quizScores = {
              ...currentProgress.quizScores,
              [lessonId]: score,
            };
          }

          // Calculate stats
          const totalCompleted =
            (classId === 'science' ? updatedProgress : state.scienceProgress).completedLessons.length +
            (classId === 'coding' ? updatedProgress : state.codingProgress).completedLessons.length +
            (classId === 'history' ? updatedProgress : state.historyProgress).completedLessons.length;

          const totalQuizzes =
            Object.keys((classId === 'science' ? updatedProgress : state.scienceProgress).quizScores).length +
            Object.keys((classId === 'coding' ? updatedProgress : state.codingProgress).quizScores).length +
            Object.keys((classId === 'history' ? updatedProgress : state.historyProgress).quizScores).length;

          return {
            [progressKey]: updatedProgress,
            totalLessonsCompleted: totalCompleted,
            totalQuizzesPassed: totalQuizzes,
          };
        });
      },

      unlockAchievement: (achievement) => {
        set((state) => {
          // Check if already unlocked
          if (state.achievements.some(a => a.id === achievement.id)) {
            return state;
          }

          return {
            achievements: [...state.achievements, achievement],
            coins: state.coins + 50, // Bonus coins for achievement
          };
        });
      },

      addBadge: (badgeId) => {
        set((state) => {
          if (state.badges.includes(badgeId)) {
            return state;
          }

          return {
            badges: [...state.badges, badgeId],
          };
        });
      },

      updateStreak: () => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const lastDate = new Date(state.lastActiveDate);
          const todayDate = new Date(today);

          const daysDiff = Math.floor(
            (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff === 1) {
            // Consecutive day
            return {
              streakDays: state.streakDays + 1,
              lastActiveDate: today,
            };
          } else if (daysDiff > 1) {
            // Streak broken
            return {
              streakDays: 1,
              lastActiveDate: today,
            };
          }

          // Same day, no change
          return { lastActiveDate: today };
        });
      },

      reset: () => {
        set(initialState);
      },

      persist: {
        clearStorage: async () => {
          await AsyncStorage.removeItem('user-store');
        },
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper hooks
export const useUserLevel = () => {
  const { level, xp, totalXP } = useUserStore();
  const xpToNextLevel = calculateXPForNextLevel(level);
  const currentLevelXP = xp;
  const progress = (currentLevelXP / xpToNextLevel) * 100;

  return {
    level,
    xp: currentLevelXP,
    xpToNextLevel,
    progress,
    totalXP,
  };
};

export const useClassProgress = (classId: 'science' | 'coding' | 'history') => {
  const progressKey = `${classId}Progress` as const;
  const progress = useUserStore((state) => state[progressKey]);

  return {
    ...progress,
    completionPercentage: 0, // Will calculate based on total lessons
  };
};
