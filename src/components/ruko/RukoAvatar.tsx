import React from "react";
import { View } from "react-native";
import Svg, { Circle, Rect, Path, Line } from "react-native-svg";

type Emotion = "happy" | "sad" | "angry" | "listening" | "thinking";

export default function RukoAvatar({
  emotion = "happy",
}: {
  emotion: Emotion;
}) {
  // Dynamic Eye Colors
  const eyeColor = emotion === "angry" ? "#FF5252" : "#4FC3F7";
  const mouthStroke = emotion === "angry" ? "#FF5252" : "#4FC3F7";

  return (
    <View className="items-center justify-center">
      <Svg width="200" height="200" viewBox="0 0 200 200">
        {/* Antenna */}
        <Line x1="100" y1="20" x2="100" y2="50" stroke="#333" strokeWidth="4" />
        <Circle
          cx="100"
          cy="20"
          r="8"
          fill={emotion === "thinking" ? "#FFEB3B" : "#FF5252"}
        />

        {/* Body */}
        <Rect
          x="40"
          y="50"
          width="120"
          height="100"
          rx="30"
          fill="#FFB74D"
          stroke="#E65100"
          strokeWidth="4"
        />

        {/* Face Screen */}
        <Rect x="60" y="70" width="80" height="50" rx="10" fill="#263238" />

        {/* --- DYNAMIC FACIAL EXPRESSIONS --- */}

        {/* EYES */}
        {emotion === "sad" ? (
          // Sad Eyes (Downwards curves)
          <>
            <Path
              d="M 75 92 Q 80 88 85 92"
              stroke={eyeColor}
              strokeWidth="2"
              fill="none"
            />
            <Path
              d="M 115 92 Q 120 88 125 92"
              stroke={eyeColor}
              strokeWidth="2"
              fill="none"
            />
          </>
        ) : emotion === "listening" ? (
          // Listening (One eye bigger)
          <>
            <Circle cx="80" cy="90" r="8" fill={eyeColor} />
            <Circle cx="120" cy="90" r="5" fill={eyeColor} />
          </>
        ) : (
          // Normal Eyes
          <>
            <Circle cx="80" cy="90" r="6" fill={eyeColor} />
            <Circle cx="120" cy="90" r="6" fill={eyeColor} />
          </>
        )}

        {/* MOUTH */}
        {emotion === "happy" && (
          <Path
            d="M 85 105 Q 100 115 115 105"
            stroke={mouthStroke}
            strokeWidth="3"
            fill="none"
          />
        )}
        {emotion === "sad" && (
          <Path
            d="M 85 110 Q 100 100 115 110"
            stroke={mouthStroke}
            strokeWidth="3"
            fill="none"
          />
        )}
        {emotion === "angry" && (
          <Line
            x1="85"
            y1="110"
            x2="115"
            y2="110"
            stroke={mouthStroke}
            strokeWidth="3"
          />
        )}
        {emotion === "listening" && (
          <Circle cx="100" cy="110" r="3" fill={mouthStroke} />
        )}

        {/* Arms (Static for now) */}
        <Path
          d="M 40 100 Q 20 100 20 80"
          stroke="#E65100"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Path
          d="M 160 100 Q 180 100 180 80"
          stroke="#E65100"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
