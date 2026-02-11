// src/components/ruko/LivingRuko.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  PanResponder,
  Animated as RNAnimated, // Standard React Native Animated
  Easing as RNEasing,
} from "react-native";
import Svg, {
  Circle,
  Rect,
  Path,
  Line,
  G,
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  cancelAnimation,
  useAnimatedProps,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- Types ---
type TimeoutId = ReturnType<typeof setTimeout>;

// Face Variations
const FACE_VARIATIONS: Record<string, any[]> = {
  happy: [
    { mouth: "M 85 105 Q 100 115 115 105", eyeOffsetY: 0, browTilt: 0 },
    { mouth: "M 80 102 Q 100 118 120 102", eyeOffsetY: -2, browTilt: -5 },
    { mouth: "M 88 108 Q 100 112 112 108", eyeOffsetY: 1, browTilt: 3 },
  ],
  sad: [
    { mouth: "M 85 110 Q 100 100 115 110", eyeOffsetY: 2, browTilt: 8 },
    { mouth: "M 88 112 Q 100 105 112 112", eyeOffsetY: 3, browTilt: 12 },
    { mouth: "M 82 108 Q 100 98 118 108", eyeOffsetY: 1, browTilt: 6 },
  ],
  angry: [
    { mouth: "M 85 110 L 115 110", eyeOffsetY: 1, browTilt: -15 },
    { mouth: "M 88 112 L 112 108", eyeOffsetY: 0, browTilt: -20 },
    { mouth: "M 90 110 L 110 110", eyeOffsetY: 2, browTilt: -10 },
  ],
  excited: [
    { mouth: "M 80 100 Q 100 120 120 100", eyeOffsetY: -3, browTilt: -8 },
    { mouth: "M 85 95 Q 100 125 115 95", eyeOffsetY: -5, browTilt: -12 },
    { mouth: "M 82 102 Q 100 118 118 102", eyeOffsetY: -2, browTilt: -5 },
  ],
  thinking: [
    { mouth: "M 88 110 L 112 110", eyeOffsetY: 0, browTilt: 5 },
    { mouth: "M 90 112 L 110 108", eyeOffsetY: 1, browTilt: 8 },
    { mouth: "M 85 108 Q 100 108 115 108", eyeOffsetY: -1, browTilt: 3 },
  ],
  listening: [
    { mouth: "M 95 108 Q 100 112 105 108", eyeOffsetY: 0, browTilt: 0 },
    { mouth: "M 92 110 Q 100 114 108 110", eyeOffsetY: 1, browTilt: -2 },
    { mouth: "M 94 109 Q 100 111 106 109", eyeOffsetY: 0, browTilt: 2 },
  ],
  celebrating: [
    { mouth: "M 75 100 Q 100 125 125 100", eyeOffsetY: -4, browTilt: -10 },
    { mouth: "M 80 95 Q 100 130 120 95", eyeOffsetY: -6, browTilt: -15 },
    { mouth: "M 78 102 Q 100 122 122 102", eyeOffsetY: -3, browTilt: -8 },
  ],
  crying: [
    { mouth: "M 85 112 Q 100 102 115 112", eyeOffsetY: 3, browTilt: 10 },
    { mouth: "M 88 115 Q 100 108 112 115", eyeOffsetY: 4, browTilt: 15 },
    { mouth: "M 82 110 Q 100 100 118 110", eyeOffsetY: 2, browTilt: 8 },
  ],
  curious: [
    { mouth: "M 90 110 Q 100 108 110 112", eyeOffsetY: 0, browTilt: -3 },
    { mouth: "M 88 108 L 112 112", eyeOffsetY: -1, browTilt: -5 },
    { mouth: "M 92 112 Q 100 108 108 110", eyeOffsetY: 1, browTilt: 0 },
  ],
  sleepy: [
    { mouth: "M 88 112 Q 100 108 112 112", eyeOffsetY: 2, browTilt: 5 },
    { mouth: "M 90 114 Q 100 110 110 114", eyeOffsetY: 3, browTilt: 8 },
    { mouth: "M 85 110 L 115 110", eyeOffsetY: 1, browTilt: 3 },
  ],
  confused: [
    { mouth: "M 90 110 Q 100 105 110 110", eyeOffsetY: 0, browTilt: -10 },
    { mouth: "M 88 112 L 112 108", eyeOffsetY: -2, browTilt: -15 },
    { mouth: "M 85 110 Q 100 115 115 110", eyeOffsetY: 1, browTilt: -5 },
  ],
};

export type Emotion = keyof typeof FACE_VARIATIONS;

interface LivingRukoProps {
  emotion?: Emotion;
  size?: number;
  onPress?: () => void;
  enableMouseTracking?: boolean;
}

const isWeb = Platform.OS === "web";
let globalMouseX = SCREEN_WIDTH / 2;
let globalMouseY = SCREEN_HEIGHT / 2;
let mouseListenerAdded = false;

const addMouseListener = () => {
  if (isWeb && typeof document !== "undefined" && !mouseListenerAdded) {
    document.addEventListener("mousemove", (e) => {
      globalMouseX = e.clientX;
      globalMouseY = e.clientY;
    });
    mouseListenerAdded = true;
  }
};

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function LivingRuko({
  emotion = "happy",
  size = 120,
  onPress,
  enableMouseTracking = true,
}: LivingRukoProps) {
  const [currentVariation, setCurrentVariation] = useState(0);
  const [tearDrops, setTearDrops] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const containerRef = useRef<View>(null);

  // Shared values
  const breathY = useSharedValue(0);
  const breathScale = useSharedValue(1);
  const blinkState = useSharedValue(1);
  const headRotate = useSharedValue(0);
  const headTiltX = useSharedValue(0);
  const bodyBounce = useSharedValue(0);
  const antennaWiggle = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const eyeLeftX = useSharedValue(0);
  const eyeLeftY = useSharedValue(0);
  const eyeRightX = useSharedValue(0);
  const eyeRightY = useSharedValue(0);
  const armWaveLeft = useSharedValue(0);
  const armWaveRight = useSharedValue(0);

  useEffect(() => {
    if (isWeb && enableMouseTracking) addMouseListener();
  }, [enableMouseTracking]);

  useEffect(() => {
    const safeEmotion = FACE_VARIATIONS[emotion] ? emotion : "happy";
    const variations = FACE_VARIATIONS[safeEmotion];
    const randomIndex = Math.floor(Math.random() * variations.length);
    setCurrentVariation(randomIndex);
  }, [emotion]);

  // Breathing Animation
  useEffect(() => {
    breathY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.98, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  // Blinking Animation
  useEffect(() => {
    let timeoutId: TimeoutId;
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000;
      timeoutId = setTimeout(() => {
        blinkState.value = withSequence(
          withTiming(0.1, { duration: 100 }),
          withTiming(1, { duration: 150 }),
          withTiming(0.1, { duration: 100 }),
          withTiming(1, { duration: 150 }),
        );
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  // Antenna Wiggle
  useEffect(() => {
    antennaWiggle.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  // Mouse/Touch Tracking
  useEffect(() => {
    if (!isWeb || !enableMouseTracking) return;
    let rafId: number;
    const updateMouseTracking = () => {
      if (containerRef.current && typeof document !== "undefined") {
        containerRef.current.measureInWindow((x, y, width, height) => {
          if (x !== undefined && y !== undefined && width > 0) {
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const offsetX = (globalMouseX - centerX) / (SCREEN_WIDTH / 2);
            const offsetY = (globalMouseY - centerY) / (SCREEN_HEIGHT / 2);
            const clampedX = Math.max(-1, Math.min(1, offsetX));
            const clampedY = Math.max(-1, Math.min(1, offsetY));

            eyeLeftX.value = withSpring(clampedX * 3, {
              damping: 20,
              stiffness: 100,
            });
            eyeLeftY.value = withSpring(clampedY * 2, {
              damping: 20,
              stiffness: 100,
            });
            eyeRightX.value = withSpring(clampedX * 3, {
              damping: 20,
              stiffness: 100,
            });
            eyeRightY.value = withSpring(clampedY * 2, {
              damping: 20,
              stiffness: 100,
            });
            headTiltX.value = withSpring(clampedX * 5, {
              damping: 15,
              stiffness: 80,
            });
          }
        });
      }
      rafId = requestAnimationFrame(updateMouseTracking);
    };
    rafId = requestAnimationFrame(updateMouseTracking);
    return () => cancelAnimationFrame(rafId);
  }, [isWeb, enableMouseTracking]);

  // Emotion-based Animations
  useEffect(() => {
    cancelAnimation(armWaveLeft);
    cancelAnimation(armWaveRight);
    cancelAnimation(bodyBounce);
    armWaveLeft.value = 0;
    armWaveRight.value = 0;
    bodyBounce.value = 0;

    switch (emotion) {
      case "happy":
        headRotate.value = withSpring(0);
        glowIntensity.value = withTiming(0);
        armWaveLeft.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 500 }),
            withTiming(0, { duration: 500 }),
          ),
          2,
          true,
        );
        break;
      case "confused":
        headRotate.value = withSpring(-15);
        eyeLeftY.value = withSpring(-3);
        eyeRightY.value = withSpring(3);
        break;
      case "excited":
        glowIntensity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0.3, { duration: 300 }),
          ),
          -1,
          true,
        );
        bodyBounce.value = withRepeat(
          withSequence(
            withTiming(-8, { duration: 400 }),
            withTiming(0, { duration: 400 }),
          ),
          -1,
          true,
        );
        armWaveLeft.value = withRepeat(
          withTiming(-20, { duration: 300 }),
          -1,
          true,
        );
        armWaveRight.value = withRepeat(
          withTiming(20, { duration: 300 }),
          -1,
          true,
        );
        break;
      case "sad":
        headRotate.value = withSpring(-8);
        glowIntensity.value = withTiming(0.2);
        break;
      case "crying":
        headRotate.value = withSpring(-5);
        glowIntensity.value = withTiming(0.2);
        const interval = setInterval(() => {
          setTearDrops((prev) => [
            ...prev.slice(-2),
            { id: Date.now(), x: 75 + Math.random() * 10, y: 95 },
          ]);
        }, 1500);
        return () => clearInterval(interval);
      case "angry":
        headRotate.value = withSpring(5);
        glowIntensity.value = withTiming(1);
        bodyBounce.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 50 }),
            withTiming(2, { duration: 50 }),
          ),
          10,
          true,
        );
        break;
      case "thinking":
        headRotate.value = withSpring(10);
        glowIntensity.value = withRepeat(
          withTiming(0.8, { duration: 1500 }),
          -1,
          true,
        );
        eyeLeftY.value = withTiming(-2, { duration: 500 });
        eyeRightY.value = withTiming(-2, { duration: 500 });
        break;
      case "listening":
        headRotate.value = withSpring(3);
        break;
      case "celebrating":
        glowIntensity.value = withTiming(1);
        bodyBounce.value = withRepeat(
          withSequence(
            withTiming(-15, { duration: 300 }),
            withTiming(0, { duration: 300 }),
          ),
          -1,
          true,
        );
        armWaveLeft.value = withRepeat(
          withSequence(
            withTiming(-30, { duration: 200 }),
            withTiming(0, { duration: 200 }),
          ),
          -1,
          true,
        );
        armWaveRight.value = withRepeat(
          withSequence(
            withTiming(30, { duration: 200 }),
            withTiming(0, { duration: 200 }),
          ),
          -1,
          true,
        );
        break;
      case "sleepy":
        headRotate.value = withSpring(-5);
        break;
      case "curious":
        headRotate.value = withSpring(-8);
        eyeLeftX.value = withTiming(-2, { duration: 500 });
        eyeRightX.value = withTiming(2, { duration: 500 });
        break;
    }
    return () => cancelAnimation(bodyBounce);
  }, [emotion]);

  const handlePress = useCallback(() => {
    bodyBounce.value = withSequence(
      withSpring(-15, { damping: 5 }),
      withSpring(5, { damping: 5 }),
      withSpring(0, { damping: 10 }),
    );
    headRotate.value = withSequence(
      withTiming(-15, { duration: 100 }),
      withTiming(15, { duration: 100 }),
      withSpring(0, { damping: 8 }),
    );
    if (onPress) onPress();
  }, [onPress]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => handlePress(),
      onPanResponderMove: (_, gestureState) => {
        eyeLeftX.value = gestureState.dx / 10;
        eyeLeftY.value = gestureState.dy / 10;
        eyeRightX.value = gestureState.dx / 10;
        eyeRightY.value = gestureState.dy / 10;
      },
      onPanResponderRelease: () => {
        eyeLeftX.value = withSpring(0);
        eyeLeftY.value = withSpring(0);
        eyeRightX.value = withSpring(0);
        eyeRightY.value = withSpring(0);
      },
    }),
  ).current;

  const safeEmotion = FACE_VARIATIONS[emotion] ? emotion : "happy";
  const variations = FACE_VARIATIONS[safeEmotion];
  const safeIndex =
    variations && variations[currentVariation] ? currentVariation : 0;
  const face = variations[safeIndex];

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: breathY.value + bodyBounce.value },
      { scale: breathScale.value },
      { rotate: `${headRotate.value + headTiltX.value}deg` },
    ],
  }));

  const leftEyeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: eyeLeftY.value + (face?.eyeOffsetY || 0) },
      { scaleY: blinkState.value },
      { scaleX: blinkState.value > 1 ? blinkState.value : 1 },
    ],
    opacity: emotion === "sleepy" ? 0.6 : 1,
  }));

  const rightEyeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: eyeRightY.value + (face?.eyeOffsetY || 0) },
      { scaleY: blinkState.value },
      { scaleX: blinkState.value > 1 ? blinkState.value : 1 },
    ],
    opacity: emotion === "sleepy" ? 0.6 : 1,
  }));

  const leftPupilStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: eyeLeftX.value }, { translateY: eyeLeftY.value }],
  }));

  const rightPupilStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: eyeRightX.value },
      { translateY: eyeRightY.value },
    ],
  }));

  // FIX: Stable Rotation for SVG Elements (avoiding matrix glitches on Android)
  // We use Translate -> Rotate -> Inverse Translate to simulate transform-origin

  // Pivot for antenna: 100, 35 (top of head)
  const antennaAnimatedProps = useAnimatedProps(() => ({
    transform: [
      { translateX: 100 },
      { translateY: 35 },
      { rotate: `${antennaWiggle.value}deg` },
      { translateX: -100 },
      { translateY: -35 },
    ],
  }));

  // Pivot for Left Arm: 35, 90 (shoulder position)
  const leftArmAnimatedProps = useAnimatedProps(() => ({
    transform: [
      { translateX: 35 },
      { translateY: 90 },
      { rotate: `${armWaveLeft.value}deg` },
      { translateX: -35 },
      { translateY: -90 },
    ],
  }));

  // Pivot for Right Arm: 165, 90 (shoulder position)
  const rightArmAnimatedProps = useAnimatedProps(() => ({
    transform: [
      { translateX: 165 },
      { translateY: 90 },
      { rotate: `${armWaveRight.value}deg` },
      { translateX: -165 },
      { translateY: -90 },
    ],
  }));

  const getGlowColor = () => {
    switch (emotion) {
      case "angry":
        return "#FF5252";
      case "excited":
        return "#FFD700";
      case "thinking":
        return "#FFEB3B";
      case "celebrating":
        return "#FF6B9D";
      case "confused":
        return "#AB47BC";
      default:
        return "#FF5252";
    }
  };

  return (
    <View
      ref={containerRef}
      style={[styles.container, { width: size, height: size }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={StyleSheet.absoluteFill}
        {...panResponder.panHandlers}
      >
        <Animated.View style={[styles.rukoContainer, containerStyle]}>
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Defs>
              <RadialGradient id="bodyGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFB74D" />
                <Stop offset="100%" stopColor="#FF9800" />
              </RadialGradient>
              <RadialGradient id="screenGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#37474F" />
                <Stop offset="100%" stopColor="#263238" />
              </RadialGradient>
            </Defs>

            {/* Left Arm */}
            <AnimatedG animatedProps={leftArmAnimatedProps}>
              <Path
                d="M 35 90 Q 10 90 10 60"
                stroke="#E65100"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
            </AnimatedG>

            {/* Right Arm */}
            <AnimatedG animatedProps={rightArmAnimatedProps}>
              <Path
                d="M 165 90 Q 190 90 190 60"
                stroke="#E65100"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
            </AnimatedG>

            {/* Antenna */}
            <AnimatedG animatedProps={antennaAnimatedProps}>
              <Line
                x1="100"
                y1="45"
                x2="100"
                y2="25"
                stroke="#424242"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <Circle cx="100" cy="20" r="8" fill={getGlowColor()} />
              <AnimatedCircle
                cx="100"
                cy="20"
                r="12"
                fill="none"
                stroke={getGlowColor()}
                strokeWidth="2"
                animatedProps={useAnimatedProps(() => ({
                  opacity: glowIntensity.value * 0.5,
                }))}
              />
            </AnimatedG>

            <Rect
              x="40"
              y="50"
              width="120"
              height="100"
              rx="30"
              fill="url(#bodyGradient)"
              stroke="#E65100"
              strokeWidth="3"
            />
            <Ellipse
              cx="100"
              cy="65"
              rx="35"
              ry="12"
              fill="white"
              opacity="0.2"
            />
            <Rect
              x="60"
              y="70"
              width="80"
              height="55"
              rx="12"
              fill="url(#screenGradient)"
            />
            <Path
              d="M 65 75 L 135 75"
              stroke="white"
              strokeWidth="2"
              opacity="0.1"
              strokeLinecap="round"
            />

            {face?.browTilt !== 0 && (
              <G>
                <Line
                  x1="70"
                  y1={78 + (face?.browTilt || 0)}
                  x2="90"
                  y2={82 - (face?.browTilt || 0)}
                  stroke="#4FC3F7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity={0.6}
                />
                <Line
                  x1="110"
                  y1={82 - (face?.browTilt || 0)}
                  x2="130"
                  y2={78 + (face?.browTilt || 0)}
                  stroke="#4FC3F7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity={0.6}
                />
              </G>
            )}

            <Path
              d={face?.mouth || "M 85 105 Q 100 115 115 105"}
              stroke={
                emotion === "angry"
                  ? "#FF5252"
                  : emotion === "excited"
                    ? "#FFD700"
                    : "#4FC3F7"
              }
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {(emotion === "happy" ||
              emotion === "excited" ||
              emotion === "celebrating") && (
              <>
                <Circle cx="65" cy="105" r="5" fill="#FF8A80" opacity="0.4" />
                <Circle cx="135" cy="105" r="5" fill="#FF8A80" opacity="0.4" />
              </>
            )}

            {emotion === "thinking" && (
              <Path
                d="M 140 85 Q 142 90 140 95 Q 138 90 140 85"
                fill="#4FC3F7"
                opacity="0.6"
              />
            )}

            {emotion === "confused" && (
              <Path
                d="M 135 60 L 145 50 M 140 60 L 140 45"
                stroke="#AB47BC"
                strokeWidth="3"
                opacity="0.8"
              />
            )}
          </Svg>

          <Animated.View style={[styles.eye, styles.eyeLeft, leftEyeStyle]}>
            <View
              style={[styles.eyeBall, emotion === "angry" && styles.eyeAngry]}
            >
              <Animated.View style={[styles.eyeShine, leftPupilStyle]} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.eye, styles.eyeRight, rightEyeStyle]}>
            <View
              style={[styles.eyeBall, emotion === "angry" && styles.eyeAngry]}
            >
              <Animated.View style={[styles.eyeShine, rightPupilStyle]} />
            </View>
          </Animated.View>

          {tearDrops.map((tear) => (
            <TearDrop
              key={tear.id}
              x={tear.x}
              y={tear.y}
              size={size}
              onComplete={() =>
                setTearDrops((prev) => prev.filter((t) => t.id !== tear.id))
              }
            />
          ))}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const TearDrop = ({
  x,
  y,
  size,
  onComplete,
}: {
  x: number;
  y: number;
  size: number;
  onComplete: () => void;
}) => {
  // FIX: Use standard RN Animated with useNativeDriver: FALSE to prevent crashes
  // when nodes are unmounted or modified rapidly on Android.
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const opacity = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(translateY, {
        toValue: 40,
        duration: 1800,
        easing: RNEasing.linear,
        useNativeDriver: false, // <--- CRITICAL FIX
      }),
      RNAnimated.timing(opacity, {
        toValue: 0,
        duration: 1800,
        easing: RNEasing.linear,
        useNativeDriver: false, // <--- CRITICAL FIX
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });

    // Cleanup to prevent memory leaks if component unmounts
    return () => {
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, []);

  return (
    <RNAnimated.View
      style={[
        styles.tearDrop,
        {
          left: (x / 200) * size,
          top: (y / 200) * size,
          opacity: opacity,
          transform: [{ translateY: translateY }],
        },
      ]}
    >
      <Svg width={10} height={10} viewBox="0 0 10 10">
        <Circle cx="5" cy="5" r="3.5" fill="#4FC3F7" opacity="0.9" />
      </Svg>
    </RNAnimated.View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  rukoContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  eye: { position: "absolute", width: 10, height: 10, zIndex: 20 },
  eyeLeft: { left: "40%", top: "45%", marginLeft: -5, marginTop: -5 },
  eyeRight: { left: "60%", top: "45%", marginLeft: -5, marginTop: -5 },
  eyeBall: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#4FC3F7",
    shadowColor: "#4FC3F7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeAngry: {
    backgroundColor: "#FF5252",
    shadowColor: "#FF5252",
    borderRadius: 2.5,
    transform: [{ scaleY: 0.6 }],
  },
  eyeShine: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "white",
    opacity: 0.9,
  },
  tearDrop: { position: "absolute", zIndex: 25 },
});
