// src/components/ruko/RukoAvatar.tsx
import React from 'react';
import LivingRuko from './LivingRuko';

type Emotion = "happy" | "sad" | "angry" | "listening" | "thinking" | "excited" | "celebrating" | "crying" | "curious" | "sleepy";

interface RukoAvatarProps {
  emotion?: Emotion;
  size?: number;
}

export default function RukoAvatar({ emotion = "happy", size = 100 }: RukoAvatarProps) {
  return (
    <LivingRuko
      emotion={emotion}
      size={size} // Pass size through
      onPress={() => {
        console.log('Ruko says hello!');
      }}
    />
  );
}
