import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Rect, Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';

type Emotion = 'happy' | 'sad' | 'excited' | 'thinking' | 'talking' | 'listening';

interface RukoProps {
  emotion?: Emotion;
  size?: number;
  onPress?: () => void;
}

export default function LivingRuko({ emotion = 'happy', size = 200, onPress }: RukoProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  // Core animations
  const breath = useSharedValue(0);
  const blink = useSharedValue(1);
  const headTilt = useSharedValue(0);
  const scale = useSharedValue(1);
  const antennaGlow = useSharedValue(0);

  // Eye animations
  const leftEyeScale = useSharedValue(1);
  const rightEyeScale = useSharedValue(1);

  // Skip complex animations on web
  const shouldAnimate = Platform.OS !== 'web';

  // Emotion reactions
  useEffect(() => {
    if (!shouldAnimate) return;

    const config = { duration: 400 };

    switch (emotion) {
      case 'happy':
        headTilt.value = withSpring(0);
        antennaGlow.value = withTiming(0, config);
        leftEyeScale.value = withTiming(1, config);
        rightEyeScale.value = withTiming(1, config);
        break;

      case 'excited':
        antennaGlow.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          3,
          true
        );
        break;

      case 'sad':
        headTilt.value = withSpring(-10);
        antennaGlow.value = withTiming(0, config);
        break;

      case 'thinking':
        headTilt.value = withSpring(8);
        antennaGlow.value = withRepeat(
          withTiming(1, { duration: 1000 }),
          -1,
          true
        );
        break;

      case 'listening':
        leftEyeScale.value = withTiming(1.3, config);
        rightEyeScale.value = withTiming(0.8, config);
        headTilt.value = withSpring(5);
        break;
    }
  }, [emotion, shouldAnimate]);

  // Breathing animation
  useEffect(() => {
    if (!shouldAnimate) return;

    breath.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [shouldAnimate]);

  // Natural blinking
  useEffect(() => {
    if (!shouldAnimate) return;

    const doBlink = () => {
      const randomDelay = 2000 + Math.random() * 3000;

      setTimeout(() => {
        blink.value = withSequence(
          withTiming(0, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );
        doBlink();
      }, randomDelay);
    };

    doBlink();
  }, [shouldAnimate]);

  // Play sound helper
  const playSound = async () => {
    if (Platform.OS === 'web') return;

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
    } catch (error) {
      // Silently fail
    }
  };

  // Touch interaction
  const handlePress = () => {
    setIsInteracting(true);

    if (shouldAnimate) {
      // Bounce animation
      scale.value = withSequence(
        withSpring(0.85, { damping: 5 }),
        withSpring(1.1, { damping: 5 }),
        withSpring(1, { damping: 10 })
      );

      // Head shake
      headTilt.value = withSequence(
        withTiming(-12, { duration: 80 }),
        withTiming(12, { duration: 80 }),
        withSpring(0, { damping: 10 })
      );

      // Antenna flash
      antennaGlow.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );

      playSound();
    }

    setTimeout(() => setIsInteracting(false), 500);

    if (onPress) {
      onPress();
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    if (!shouldAnimate) {
      return { width: size, height: size };
    }

    return {
      width: size,
      height: size,
      transform: [
        { translateY: breath.value },
        { rotate: `${headTilt.value}deg` },
        { scale: scale.value }
      ]
    };
  });

  const leftEyeStyle = useAnimatedStyle(() => {
    if (!shouldAnimate) return {};

    return {
      transform: [
        { scaleY: blink.value },
        { scale: leftEyeScale.value }
      ],
    };
  });

  const rightEyeStyle = useAnimatedStyle(() => {
    if (!shouldAnimate) return {};

    return {
      transform: [
        { scaleY: blink.value },
        { scale: rightEyeScale.value }
      ],
    };
  });

  // Antenna color based on emotion
  const antennaColor = emotion === 'thinking' ? '#FFEB3B' : '#FF5252';
  const mouthColor = emotion === 'excited' ? '#FFD700' : '#4FC3F7';

  // Mouth path based on emotion
  const getMouthPath = () => {
    switch (emotion) {
      case 'happy':
      case 'excited':
        return "M 85 105 Q 100 115 115 105";
      case 'sad':
        return "M 85 110 Q 100 100 115 110";
      case 'thinking':
        return "M 88 110 L 112 110";
      case 'listening':
        return "M 95 108 Q 100 112 105 108";
      default:
        return "M 85 105 Q 100 115 115 105";
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.touchable}
    >
      <Animated.View style={containerStyle}>
        {/* Main SVG Body */}
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          {/* Antenna */}
          <Line x1="100" y1="20" x2="100" y2="50" stroke="#333" strokeWidth="4" />
          <Circle cx="100" cy="20" r="8" fill={antennaColor} />

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
          <Rect x="60" y="70" width="80" height="50" rx="10" fill="#263238" />

          {/* Mouth - FIXED: Now inside the SVG, not separate */}
          <Path
            d={getMouthPath()}
            stroke={mouthColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Arms */}
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

        {/* Eyes - FIXED: Properly positioned within container */}
        <View style={styles.eyesContainer}>
          <Animated.View style={[styles.eyeLeft, leftEyeStyle]}>
            <View style={styles.eyeBase} />
          </Animated.View>

          <Animated.View style={[styles.eyeRight, rightEyeStyle]}>
            <View style={styles.eyeBase} />
          </Animated.View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    // This ensures the entire area is touchable
  },
  eyesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none', // CRITICAL: Don't block touches
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
});
