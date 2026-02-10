import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Rect, Path, Line, Ellipse } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';

// --- TYPES ---
type Emotion = 'happy' | 'sad' | 'excited' | 'thinking' | 'talking' | 'listening';

interface RukoProps {
  emotion?: Emotion;
  size?: number;
  onPress?: () => void;
}

export default function LivingRuko({ emotion = 'happy', size = 200, onPress }: RukoProps) {
  // --- STATE ---
  const [isPressed, setIsPressed] = useState(false);

  // --- SHARED VALUES (properly initialized) ---
  const breath = useSharedValue(0);
  const blink = useSharedValue(1); // 1 = Open, 0 = Closed
  const headTilt = useSharedValue(0);
  const scale = useSharedValue(1);
  const antennaGlow = useSharedValue(0);
  const leftArmWave = useSharedValue(0);
  const rightArmWave = useSharedValue(0);
  const bodyBounce = useSharedValue(0);

  // Eye expressions
  const leftEyeScale = useSharedValue(1);
  const rightEyeScale = useSharedValue(1);
  const eyeSparkle = useSharedValue(0);

  // Mouth animations
  const mouthHappiness = useSharedValue(emotion === 'happy' || emotion === 'excited' ? 1 : 0);
  const mouthTalk = useSharedValue(0);

  // --- EMOTION SYSTEM ---
  useEffect(() => {
    const config = { duration: Platform.OS === 'web' ? 100 : 400 };

    switch (emotion) {
      case 'happy':
        mouthHappiness.value = withTiming(1, config);
        antennaGlow.value = withTiming(0, config);
        headTilt.value = withSpring(0);
        break;

      case 'excited':
        mouthHappiness.value = withTiming(1.5, config);
        antennaGlow.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          Platform.OS === 'web' ? 0 : -1,
          true
        );
        // Excited bounce
        if (Platform.OS !== 'web') {
          bodyBounce.value = withRepeat(
            withSequence(
              withSpring(-8, { damping: 8 }),
              withSpring(0, { damping: 8 })
            ),
            3,
            true
          );
        }
        break;

      case 'sad':
        mouthHappiness.value = withTiming(-1, config);
        antennaGlow.value = withTiming(0, config);
        headTilt.value = withSpring(-10);
        break;

      case 'thinking':
        mouthHappiness.value = withTiming(0, config);
        antennaGlow.value = withRepeat(
          withTiming(1, { duration: 1000 }),
          Platform.OS === 'web' ? 0 : -1,
          true
        );
        headTilt.value = withSpring(8);
        break;

      case 'talking':
        mouthTalk.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 150 }),
            withTiming(0, { duration: 150 })
          ),
          Platform.OS === 'web' ? 0 : -1,
          true
        );
        break;

      case 'listening':
        leftEyeScale.value = withTiming(1.3, config);
        rightEyeScale.value = withTiming(0.8, config);
        headTilt.value = withSpring(5);
        break;
    }

    // Reset talk when not talking
    if (emotion !== 'talking') {
      mouthTalk.value = withTiming(0, { duration: 200 });
    }

    // Reset eye scales for normal emotions
    if (emotion !== 'listening') {
      leftEyeScale.value = withTiming(1, config);
      rightEyeScale.value = withTiming(1, config);
    }

  }, [emotion]);

  // --- IDLE ANIMATIONS (Life-like behaviors) ---
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Breathing (always active)
    breath.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Occasional head tilt (unless emotion overrides)
    const tiltInterval = setInterval(() => {
      if (emotion === 'happy' && Math.random() > 0.7) {
        headTilt.value = withSequence(
          withSpring(5, { damping: 10 }),
          withDelay(1000, withSpring(0, { damping: 10 }))
        );
      }
    }, 4000);

    // Occasional arm wave
    const waveInterval = setInterval(() => {
      if (emotion === 'happy' || emotion === 'excited') {
        const whichArm = Math.random() > 0.5 ? leftArmWave : rightArmWave;
        whichArm.value = withSequence(
          withSpring(1, { damping: 8 }),
          withDelay(400, withSpring(0, { damping: 8 }))
        );
      }
    }, 6000);

    // Eye sparkle (occasional)
    const sparkleInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        eyeSparkle.value = withSequence(
          withTiming(1, { duration: 200 }),
          withDelay(300, withTiming(0, { duration: 200 }))
        );
      }
    }, 5000);

    return () => {
      clearInterval(tiltInterval);
      clearInterval(waveInterval);
      clearInterval(sparkleInterval);
    };
  }, [emotion]);

  // --- BLINKING (Natural random blinks) ---
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const blinkLoop = () => {
      const randomDelay = 2000 + Math.random() * 3000; // 2-5 seconds

      setTimeout(() => {
        blink.value = withSequence(
          withTiming(0, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );
        blinkLoop();
      }, randomDelay);
    };

    blinkLoop();
  }, []);

  // --- INTERACTION (Press Response) ---
  const handlePress = async () => {
    setIsPressed(true);

    if (Platform.OS !== 'web') {
      // Bounce with personality
      scale.value = withSequence(
        withSpring(0.85, { damping: 5 }),
        withSpring(1.1, { damping: 5 }),
        withSpring(1, { damping: 10 })
      );

      // Head shake
      headTilt.value = withSequence(
        withTiming(-12, { duration: 80 }),
        withTiming(12, { duration: 80 }),
        withTiming(-8, { duration: 80 }),
        withSpring(0, { damping: 10 })
      );

      // Both arms wave
      leftArmWave.value = withSpring(1, { damping: 8 });
      rightArmWave.value = withSpring(1, { damping: 8 });

      setTimeout(() => {
        leftArmWave.value = withSpring(0, { damping: 8 });
        rightArmWave.value = withSpring(0, { damping: 8 });
      }, 500);

      // Antenna flash
      antennaGlow.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );

      // Play sound
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/audio/sfx/pop.mp3')
        );
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            await sound.unloadAsync();
          }
        });
      } catch (e) {
        // Silent fail
      }
    }

    setTimeout(() => setIsPressed(false), 300);
    if (onPress) onPress();
  };

  // --- ANIMATED STYLES ---
  const containerStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'web') {
      return { width: size, height: size };
    }

    return {
      width: size,
      height: size,
      transform: [
        { translateY: breath.value + bodyBounce.value },
        { rotate: `${headTilt.value}deg` },
        { scale: scale.value }
      ]
    };
  });

  const leftEyeStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: Platform.OS === 'web' ? 1 : blink.value },
      { scale: Platform.OS === 'web' ? 1 : leftEyeScale.value }
    ],
  }));

  const rightEyeStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: Platform.OS === 'web' ? 1 : blink.value },
      { scale: Platform.OS === 'web' ? 1 : rightEyeScale.value }
    ],
  }));

  const leftArmStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'web') return {};

    const rotation = interpolate(
      leftArmWave.value,
      [0, 1],
      [0, -25],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ rotate: `${rotation}deg` }],
      transformOrigin: 'top right'
    };
  });

  const rightArmStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'web') return {};

    const rotation = interpolate(
      rightArmWave.value,
      [0, 1],
      [0, 25],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ rotate: `${rotation}deg` }],
      transformOrigin: 'top left'
    };
  });

  // Dynamic colors based on emotion
  const getAntennaColor = () => {
    if (Platform.OS === 'web') {
      return emotion === 'thinking' ? '#FFEB3B' : '#FF5252';
    }

    const glowValue = antennaGlow.value;
    if (emotion === 'thinking') {
      return glowValue > 0.5 ? '#FFD700' : '#FFEB3B';
    }
    if (emotion === 'excited') {
      return glowValue > 0.5 ? '#FF6B9D' : '#FF5252';
    }
    return '#FF5252';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <Animated.View style={containerStyle}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">

          {/* --- BODY BASE --- */}

          {/* Antenna with glow effect */}
          <Line
            x1="100" y1="20" x2="100" y2="50"
            stroke="#333"
            strokeWidth="4"
          />
          <Circle
            cx="100" cy="20" r="8"
            fill={getAntennaColor()}
          />
          {/* Glow ring when thinking/excited */}
          {(emotion === 'thinking' || emotion === 'excited') && Platform.OS !== 'web' && (
            <Circle
              cx="100" cy="20" r="12"
              fill="none"
              stroke={getAntennaColor()}
              strokeWidth="2"
              opacity="0.5"
            />
          )}

          {/* Body */}
          <Rect
            x="40" y="50"
            width="120" height="100"
            rx="30"
            fill="#FFB74D"
            stroke="#E65100"
            strokeWidth="4"
          />

          {/* Face Screen */}
          <Rect
            x="60" y="70"
            width="80" height="50"
            rx="10"
            fill="#263238"
          />

        </Svg>

        {/* --- ARMS (Animated separately) --- */}
        <Animated.View style={[styles.leftArm, leftArmStyle]}>
          <Svg width="60" height="60" viewBox="0 0 60 60">
            <Path
              d="M 20 10 Q 0 10 0 -10"
              stroke="#E65100"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.rightArm, rightArmStyle]}>
          <Svg width="60" height="60" viewBox="0 0 60 60">
            <Path
              d="M 40 10 Q 60 10 60 -10"
              stroke="#E65100"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>

        {/* --- ANIMATED FACE --- */}
        <View style={styles.faceContainer}>

          {/* EYES */}
          <Animated.View style={[styles.eyeLeft, leftEyeStyle]}>
            <View style={styles.eyeBase} />
            {/* Sparkle */}
            {Platform.OS !== 'web' && (
              <View style={styles.eyeSparkle} />
            )}
          </Animated.View>

          <Animated.View style={[styles.eyeRight, rightEyeStyle]}>
            <View style={styles.eyeBase} />
            {Platform.OS !== 'web' && (
              <View style={styles.eyeSparkle} />
            )}
          </Animated.View>

          {/* MOUTH (Dynamic SVG) */}
          <View style={styles.mouthContainer}>
            <MouthShape emotion={emotion} mouthHappiness={mouthHappiness} mouthTalk={mouthTalk} />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Separate component for mouth to handle animations better
const MouthShape = ({
  emotion,
  mouthHappiness,
  mouthTalk
}: {
  emotion: Emotion,
  mouthHappiness: Animated.SharedValue<number>,
  mouthTalk: Animated.SharedValue<number>
}) => {
  const mouthStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'web') {
      // Simple static shapes for web
      return {};
    }

    return {
      opacity: 1
    };
  });

  // Different mouth shapes per emotion
  const getMouthPath = () => {
    switch (emotion) {
      case 'happy':
      case 'excited':
        return "M 85 105 Q 100 120 115 105"; // Big smile
      case 'sad':
        return "M 85 112 Q 100 102 115 112"; // Frown
      case 'thinking':
        return "M 88 110 L 112 110"; // Straight line
      case 'talking':
        return "M 90 108 Q 100 115 110 108"; // Small O
      default:
        return "M 85 105 Q 100 115 115 105";
    }
  };

  const getMouthColor = () => {
    switch (emotion) {
      case 'excited':
        return '#FFD700';
      case 'sad':
        return '#546E7A';
      case 'thinking':
        return '#FFEB3B';
      default:
        return '#4FC3F7';
    }
  };

  return (
    <Animated.View style={mouthStyle}>
      <Svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute' }}>
        <Path
          d={getMouthPath()}
          stroke={getMouthColor()}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  faceContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  eyeLeft: {
    position: 'absolute',
    top: '45%',
    left: '40%',
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
  },
  eyeRight: {
    position: 'absolute',
    top: '45%',
    left: '60%',
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
  },
  eyeBase: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
    backgroundColor: '#4FC3F7',
  },
  eyeSparkle: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  mouthContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  leftArm: {
    position: 'absolute',
    top: '50%',
    left: '10%',
  },
  rightArm: {
    position: 'absolute',
    top: '50%',
    right: '10%',
  }
});
