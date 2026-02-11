import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioState {
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  toggleMute: () => void;
  setVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      isMuted: false,
      volume: 0.5,
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: 'audio-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
