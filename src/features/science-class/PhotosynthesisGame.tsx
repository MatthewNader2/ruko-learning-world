// src/features/science-class/PhotosynthesisGame.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated as RNAnimated,
  PanResponder,
  Platform,
  SafeAreaView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import LivingRuko from "../../components/ruko/LivingRuko";
import { useUserStore } from "../../store/userStore";
import { useRukoEmotion } from "../../hooks/useRukoEmotion";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type GamePhase =
  | "menu"
  | "intro"
  | "sunlight"
  | "water"
  | "co2"
  | "quiz"
  | "success";
type Difficulty = "easy" | "medium" | "hard";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  rukoReaction: {
    correct: string;
    wrong: string;
  };
}

interface GameState {
  sunLevel: number;
  waterLevel: number;
  co2Level: number;
  plantHealth: number;
  mistakes: string[];
}

const QUIZ_QUESTIONS: Record<Difficulty, QuizQuestion[]> = {
  easy: [
    {
      id: 1,
      question: "What does a plant need to make food?",
      options: [
        "Sunlight & Water",
        "Music & Hugs",
        "Chocolate & Toys",
        "TV & Games",
      ],
      correctIndex: 0,
      explanation:
        "Plants need sunlight, water, and CO₂ to make food through photosynthesis!",
      rukoReaction: {
        correct: "Exactly! Plants are nature's chefs! 👨‍🍳",
        wrong: "Hmm, plants can't eat chocolate like us! Try again! 🤔",
      },
    },
    {
      id: 2,
      question: "What gas do plants breathe in?",
      options: ["Oxygen", "Carbon Dioxide (CO₂)", "Helium", "Smoke"],
      correctIndex: 1,
      explanation: "Plants take in CO₂ and give out oxygen - opposite of us!",
      rukoReaction: {
        correct: "Yes! CO₂ is plant food! 🌬️",
        wrong: "Actually, plants breathe IN CO₂, not oxygen! 🔄",
      },
    },
    {
      id: 3,
      question: "What color is chlorophyll?",
      options: ["Red", "Blue", "Green", "Yellow"],
      correctIndex: 2,
      explanation:
        "Chlorophyll is the green substance in leaves that catches sunlight!",
      rukoReaction: {
        correct: "Green is the magic color! 💚",
        wrong: "Look at leaves - they're green for a reason! 🍃",
      },
    },
  ],
  medium: [
    {
      id: 1,
      question: "Where does photosynthesis happen?",
      options: ["Roots", "Stem", "Leaves", "Flowers"],
      correctIndex: 2,
      explanation: "Leaves have chloroplasts - tiny factories that make food!",
      rukoReaction: {
        correct: "Leaves are solar panels! ☀️",
        wrong: "Roots drink water, but leaves make the food! 🍃",
      },
    },
    {
      id: 2,
      question: "What does the plant make?",
      options: ["Sugar (Glucose)", "Plastic", "Electricity", "Rocks"],
      correctIndex: 0,
      explanation: "Plants make glucose (sugar) for energy and grow!",
      rukoReaction: {
        correct: "Sweet! Plants make their own sugar! 🍯",
        wrong: "Plants aren't factories - they make sugar! 🍬",
      },
    },
    {
      id: 3,
      question: "What comes OUT of leaves?",
      options: ["Smoke", "Oxygen", "Dirt", "Colors"],
      correctIndex: 1,
      explanation:
        "Oxygen is the waste product of photosynthesis - lucky for us!",
      rukoReaction: {
        correct: "Oxygen - the gift plants give us! 💨",
        wrong: "Plants give us oxygen to breathe! 🌬️",
      },
    },
  ],
  hard: [
    {
      id: 1,
      question: "What is the chemical formula for photosynthesis?",
      options: [
        "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
        "H₂O → H₂ + O",
        "CO₂ → C + O₂",
        "Sugar → Energy",
      ],
      correctIndex: 0,
      explanation: "6 CO₂ + 6 H₂O → C₆H₁₂O₆ (glucose) + 6 O₂!",
      rukoReaction: {
        correct: "Wow! You're a science master! 🧪",
        wrong: "That's a tricky one! Look at the balanced equation! ⚖️",
      },
    },
    {
      id: 2,
      question: "Why do leaves look green?",
      options: [
        "They absorb green light",
        "They reflect green light",
        "They are painted",
        "Magic",
      ],
      correctIndex: 1,
      explanation:
        "Chlorophyll reflects green light and absorbs red/blue light!",
      rukoReaction: {
        correct: "Green is reflected - other colors are absorbed! 🌈",
        wrong: "Green bounces off - that's why we see it! 🎾",
      },
    },
    {
      id: 3,
      question: "When does photosynthesis NOT happen?",
      options: [
        "At night",
        "In winter",
        "Without chlorophyll",
        "All of the above",
      ],
      correctIndex: 3,
      explanation:
        "No light = no photosynthesis. No chlorophyll = no photosynthesis!",
      rukoReaction: {
        correct: "All correct! Photosynthesis needs specific conditions! 🎯",
        wrong: "Think about what photosynthesis needs to work! 💡",
      },
    },
  ],
};

const WRONG_CHOICES = {
  sunlight: [
    {
      emoji: "🕯️",
      name: "Candle",
      result: "The candle is too small and hot! The plant got burned! 🔥",
    },
    {
      emoji: "💡",
      name: "Lamp",
      result:
        "Regular bulbs don't have the right light for plants! The plant is sad! 😢",
    },
    {
      emoji: "🌑",
      name: "Darkness",
      result: "Plants can't see in the dark! They need sunlight! 🌑",
    },
    {
      emoji: "📱",
      name: "Phone Light",
      result: "Phone light is too weak! The plant is still hungry! 📱",
    },
  ],
  water: [
    {
      emoji: "🥤",
      name: "Soda",
      result: "Soda has sugar! Plants can't drink soda - they got sticky! 🥤",
    },
    {
      emoji: "🧃",
      name: "Juice",
      result: "Too sweet! Plants need clean water, not juice! 🧃",
    },
    {
      emoji: "🥛",
      name: "Milk",
      result: "Milk is for baby cows, not plants! The plant is confused! 🐄",
    },
    {
      emoji: "☕",
      name: "Coffee",
      result: "Caffeine makes plants jittery! They couldn't sleep! ☕",
    },
  ],
  co2: [
    {
      emoji: "🎈",
      name: "Helium",
      result: "Helium makes voices squeaky but plants can't eat it! 🎈",
    },
    {
      emoji: "💨",
      name: "Burp",
      result: "That's not CO₂! That's just rude! 😤",
    },
    {
      emoji: "🚗",
      name: "Exhaust",
      result: "Car smoke is dirty! Plants need clean CO₂! 🚗💨",
    },
    {
      emoji: "🌫️",
      name: "Fog",
      result: "That's just water vapor! Not CO₂! 🌫️",
    },
  ],
};

// --- HELPER COMPONENTS ---

// Simple back button for consistent UI
const GameBackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={
      {
        position: "absolute",
        top: 40,
        left: 20,
        zIndex: 100,
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: 10,
        borderRadius: 20,
        ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
      } as any
    }
  >
    <Text style={{ fontSize: 24 }}>⬅️</Text>
  </TouchableOpacity>
);

const FallingWaterDrop = ({
  x,
  y,
  onFinish,
}: {
  x: number;
  y: number;
  onFinish: () => void;
}) => {
  const translateY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(translateY, {
      toValue: 400,
      duration: 800,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinish();
    });
  }, []);

  return (
    <RNAnimated.View
      style={{
        position: "absolute",
        left: x - 10,
        top: y,
        transform: [{ translateY }],
      }}
    >
      <Text style={{ fontSize: 30 }}>💧</Text>
    </RNAnimated.View>
  );
};

const RisingBubble = ({
  x,
  y,
  size,
  onFinish,
}: {
  x: number;
  y: number;
  size: number;
  onFinish: () => void;
}) => {
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const scale = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(translateY, {
        toValue: -200,
        duration: 2000,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scale, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onFinish();
    });
  }, []);

  return (
    <RNAnimated.View
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: [{ translateY }, { scale }],
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#94a3b8",
          opacity: 0.5,
        }}
      />
    </RNAnimated.View>
  );
};

export default function PhotosynthesisGame({ onBack }: { onBack: () => void }) {
  const { level } = useUserStore();

  const {
    emotion: rukoEmotion,
    setEmotion: setRukoEmotion,
    reactToSuccess,
    reactToFailure,
  } = useRukoEmotion("happy");

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [rukoMessage, setRukoMessage] = useState(
    "Welcome to the Science Lab! 🔬",
  );

  const [gameState, setGameState] = useState<GameState>({
    sunLevel: 0,
    waterLevel: 0,
    co2Level: 0,
    plantHealth: 50,
    mistakes: [],
  });

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showingExplanation, setShowingExplanation] = useState(false);

  // Mini-game states
  const [plantPosition, setPlantPosition] = useState({
    x: SCREEN_WIDTH / 2 - 40,
    y: 300,
  });
  const [isInSun, setIsInSun] = useState(false);
  const [waterDrops, setWaterDrops] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [waterScore, setWaterScore] = useState(0);
  const [co2Bubbles, setCo2Bubbles] = useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);
  const [co2Score, setCo2Score] = useState(0);

  // Animation values
  const plantScale = useSharedValue(1);
  const plantRotate = useSharedValue(0);
  const sunGlow = useSharedValue(0);

  useEffect(() => {
    const newDifficulty = level < 3 ? "easy" : level < 6 ? "medium" : "hard";
    setDifficulty(newDifficulty);
  }, [level]);

  // RESET PROGRESS LOGIC
  useEffect(() => {
    if (phase === "water") {
      setWaterScore(0);
      setGameState((prev) => ({ ...prev, waterLevel: 0 }));
      setRukoMessage("The plant is thirsty! Tap to water it. 💧");
    } else if (phase === "co2") {
      setCo2Score(0);
      setGameState((prev) => ({ ...prev, co2Level: 0 }));
      setRukoMessage("Now it needs air! Add some CO₂. 🫧");
    }
  }, [phase]);

  // Ref for position to avoid stale closures
  const plantPosRef = useRef({ x: SCREEN_WIDTH / 2 - 40, y: 300 });
  // Store start offset to fix dragging on different screen coordinates
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // WEB: Prevent text selection and customize cursor
  const webStyles: any =
    Platform.OS === "web"
      ? {
          userSelect: "none",
          WebkitUserSelect: "none",
          msUserSelect: "none",
          cursor: isDraggingRef.current ? "grabbing" : "grab",
        }
      : {};

  // Re-create PanResponder to use the ref
  // Re-create PanResponder to use the ref
  const panResponderSafe = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        dragOffset.current = {
          x: plantPosRef.current.x,
          y: plantPosRef.current.y,
        };
        setPlantPosition((prev) => ({ ...prev }));
      },
      onPanResponderMove: (_, gestureState) => {
        // Use fresh dimensions to handle web resizing better
        const currentWidth = Dimensions.get("window").width;
        const currentHeight = Dimensions.get("window").height;

        const newX = Math.max(
          0,
          Math.min(currentWidth - 80, dragOffset.current.x + gestureState.dx),
        );
        const newY = Math.max(
          0,
          Math.min(currentHeight - 80, dragOffset.current.y + gestureState.dy),
        );

        plantPosRef.current = { x: newX, y: newY };
        setPlantPosition({ x: newX, y: newY });
      },
      onPanResponderRelease: () => {
        isDraggingRef.current = false;
        setPlantPosition((prev) => ({ ...prev }));

        const { x, y } = plantPosRef.current;
        const currentWidth = Dimensions.get("window").width;
        const currentHeight = Dimensions.get("window").height;

        // --- FIX: Align Collision Zones with Visual Styles ---

        // Sun is visual at: right: 20, width: 150
        // So Detection X = ScreenWidth - 20 (right margin) - 150 (width)
        const sunZone = {
          x: currentWidth - 170,
          y: 100,
          width: 150,
          height: 150,
        };

        // Shadow is visual at: left: 20, bottom: 200
        // Detection Y = ScreenHeight - 200 (bottom margin) - 150 (height)
        const shadowZone = {
          x: 20,
          y: currentHeight - 350,
          width: 150,
          height: 150,
        };

        const plantCenter = { x: x + 40, y: y + 40 };

        const inSun =
          plantCenter.x > sunZone.x &&
          plantCenter.x < sunZone.x + sunZone.width &&
          plantCenter.y > sunZone.y &&
          plantCenter.y < sunZone.y + sunZone.height;

        const inShadow =
          plantCenter.x > shadowZone.x &&
          plantCenter.x < shadowZone.x + shadowZone.width &&
          plantCenter.y > shadowZone.y &&
          plantCenter.y < shadowZone.y + shadowZone.height;

        if (inSun) {
          setIsInSun(true);
          setGameState((prev) => ({ ...prev, sunLevel: 100 }));
          sunGlow.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 500 }),
              withTiming(0.5, { duration: 500 }),
            ),
            -1,
            true,
          );
          plantScale.value = withSpring(1.2);
          setRukoMessage("Perfect! The plant loves the sunlight! ☀️");
          setRukoEmotion("excited");
          setTimeout(() => setPhase("water"), 2000);
        } else if (inShadow) {
          setRukoMessage("Too dark here! The plant needs sunlight to grow! 🌑");
          setRukoEmotion("sad");
          plantRotate.value = withSequence(
            withTiming(-5, { duration: 100 }),
            withTiming(5, { duration: 100 }),
            withTiming(0, { duration: 100 }),
          );
          setGameState((prev) => ({
            ...prev,
            mistakes: [...prev.mistakes, "Put plant in shadow"],
            plantHealth: Math.max(0, prev.plantHealth - 10),
          }));
        }
      },
    }),
  ).current;

  // Water mini-game
  const addWaterDrop = (x: number, y: number) => {
    const newDrop = { id: Date.now(), x, y };
    setWaterDrops((prev) => [...prev, newDrop]);

    const plantZone = {
      x: SCREEN_WIDTH / 2 - 50,
      width: 100,
      y: SCREEN_HEIGHT / 3,
    };

    // Correct hit logic: Drop must be horizontally aligned
    // AND starting above or on the plant top
    const hitsPlant =
      x > plantZone.x &&
      x < plantZone.x + plantZone.width &&
      y < plantZone.y + 100;

    if (hitsPlant) {
      setWaterScore((prev) => {
        const newScore = prev + 10;
        if (newScore >= 50 && newScore <= 80) {
          setGameState((s) => ({ ...s, waterLevel: newScore }));
          setRukoMessage("Perfect amount of water! 💧");
          setRukoEmotion("happy");
          // Small delay before transition to allow user to see success
          if (newScore === 50 || newScore === 60) {
            setTimeout(() => setPhase("co2"), 1500);
          }
        } else if (newScore > 80) {
          setRukoMessage("Too much water! The plant is drowning! 🌊");
          setRukoEmotion("sad");
          setGameState((s) => ({
            ...s,
            mistakes: [...s.mistakes, "Too much water"],
          }));
        }
        return newScore;
      });
    }

    setTimeout(() => {
      setWaterDrops((prev) => prev.filter((d) => d.id !== newDrop.id));
    }, 1000);
  };

  const decreaseWater = () => {
    setWaterScore((prev) => {
      const newScore = Math.max(0, prev - 10);
      setRukoMessage("Draining water... 💧");
      return newScore;
    });
  };

  // CO2 mini-game
  const addCO2Bubble = (size: "small" | "medium" | "large") => {
    const sizeMap = { small: 20, medium: 40, large: 60 };
    const newBubble = {
      id: Date.now(),
      x: Math.random() * (SCREEN_WIDTH - 100) + 50,
      y: SCREEN_HEIGHT - 100,
      size: sizeMap[size],
    };
    setCo2Bubbles((prev) => [...prev, newBubble]);

    const points = size === "small" ? 10 : size === "medium" ? 20 : -10;
    setCo2Score((prev) => {
      const newScore = Math.max(0, Math.min(100, prev + points));
      setGameState((s) => ({ ...s, co2Level: newScore }));

      if (newScore >= 60 && newScore <= 80) {
        setRukoMessage("Great CO₂ balance! The plant can breathe! 🌬️");
        setRukoEmotion("excited");
        // Only trigger transition if we entered the zone from below
        if (prev < 60) {
          setTimeout(() => setPhase("quiz"), 1500);
        }
      } else if (newScore > 80) {
        setRukoMessage("Too much CO₂! The plant is overwhelmed! 😵");
        setRukoEmotion("sad");
      } else if (newScore < 30) {
        setRukoMessage("Need more CO₂! The plant is hungry for air! 😤");
      }

      return newScore;
    });

    setTimeout(() => {
      setCo2Bubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, 2000);
  };

  const decreaseCO2 = () => {
    setCo2Score((prev) => {
      const newScore = Math.max(0, prev - 10);
      setRukoMessage("Clearing air... 🌬️");
      return newScore;
    });
  };

  const handleWrongChoice = (
    type: "sunlight" | "water" | "co2",
    choice: (typeof WRONG_CHOICES.sunlight)[0],
  ) => {
    setRukoMessage(choice.result);
    setRukoEmotion("sad");
    setGameState((prev) => ({
      ...prev,
      mistakes: [...prev.mistakes, `Tried ${choice.name}`],
      plantHealth: Math.max(0, prev.plantHealth - 15),
    }));
    plantRotate.value = withSequence(
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    );
  };

  const handleQuizAnswer = (selectedIndex: number) => {
    const currentQ = QUIZ_QUESTIONS[difficulty][currentQuizIndex];
    const isCorrect = selectedIndex === currentQ.correctIndex;

    if (isCorrect) {
      setQuizScore((prev) => prev + 20);
      setRukoMessage(currentQ.rukoReaction.correct);
      setRukoEmotion("excited");
      reactToSuccess();

      if (currentQuizIndex < QUIZ_QUESTIONS[difficulty].length - 1) {
        setTimeout(() => {
          setCurrentQuizIndex((prev) => prev + 1);
          setShowingExplanation(false);
        }, 2000);
      } else {
        setTimeout(() => setPhase("success"), 2000);
      }
    } else {
      setRukoMessage(currentQ.rukoReaction.wrong);
      setRukoEmotion("sad");
      reactToFailure();
      setShowingExplanation(true);

      setTimeout(() => {
        setShowingExplanation(false);
      }, 3000);
    }
  };

  const resetGame = () => {
    setGameState({
      sunLevel: 0,
      waterLevel: 0,
      co2Level: 0,
      plantHealth: 50,
      mistakes: [],
    });

    setCurrentQuizIndex(0);
    setQuizScore(0);
    setWaterScore(0);
    setCo2Score(0);
    setPlantPosition({ x: SCREEN_WIDTH / 2 - 40, y: 300 });
    plantPosRef.current = { x: SCREEN_WIDTH / 2 - 40, y: 300 };
    setIsInSun(false);
    setPhase("menu");
  };

  // MENU SCREEN
  if (phase === "menu") {
    return (
      <View className="flex-1 bg-slate-50">
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={onBack} className="p-2">
              <Text className="text-2xl">←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-slate-800 ml-4">
              Science Lab 🔬
            </Text>
          </View>

          <Text className="text-lg text-slate-600 mb-6">
            Choose a topic to explore:
          </Text>

          {/* Available Topic */}
          <TouchableOpacity
            onPress={() => setPhase("intro")}
            className="p-6 rounded-3xl mb-4 border-2 border-emerald-300"
            style={{ backgroundColor: "#d1fae5" }}
          >
            <View className="flex-row items-center">
              <Text className="text-4xl mr-4">🌱</Text>
              <View className="flex-1">
                <Text className="text-xl font-bold text-emerald-800">
                  Photosynthesis
                </Text>
                <Text className="text-emerald-600 text-sm">
                  How plants make food
                </Text>
                <View
                  className="self-start px-3 py-1 rounded-full mt-2"
                  style={{ backgroundColor: "#10b981" }}
                >
                  <Text className="text-white text-xs font-bold">
                    AVAILABLE
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // INTRO SCREEN
  if (phase === "intro") {
    return (
      <LinearGradient colors={["#e0f2fe", "#ecfdf5"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              padding: 24,
            }}
          >
            <Animated.View entering={FadeIn} className="items-center">
              <LivingRuko
                emotion={rukoEmotion}
                size={140}
                onPress={() => setRukoEmotion("excited")}
              />

              <Text className="text-3xl font-extrabold text-emerald-800 mt-6 text-center">
                Photosynthesis Adventure! 🌱
              </Text>

              <View
                className="p-6 rounded-3xl mt-6 w-full"
                style={{
                  backgroundColor: "white",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text className="text-lg text-slate-700 leading-7 text-center">
                  Help me grow a healthy plant by giving it exactly what it
                  needs!
                  {"\n"}
                  But be careful - wrong choices will hurt the plant! 😰
                </Text>
              </View>

              <View className="flex-row gap-4 mt-8">
                <TouchableOpacity
                  onPress={() => setPhase("sunlight")}
                  className="px-8 py-4 rounded-2xl"
                  style={{
                    backgroundColor: "#10b981",
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text className="text-white font-bold text-lg">
                    Start! 🚀
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPhase("menu")}
                  className="px-6 py-4 rounded-2xl"
                  style={{ backgroundColor: "#e2e8f0" }}
                >
                  <Text className="text-slate-600 font-bold">Back</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // SUNLIGHT MINI-GAME
  if (phase === "sunlight") {
    return (
      <View
        className="flex-1 bg-sky-200"
        {...panResponderSafe.panHandlers}
        style={Platform.OS === "web" ? ({ cursor: "default" } as any) : {}}
      >
        <GameBackButton onPress={() => setPhase("menu")} />

        {/* Sun Zone */}
        <View
          className="absolute rounded-full"
          style={{
            right: 20,
            top: 100,
            width: 150,
            height: 150,
            backgroundColor: "rgba(253, 224, 71, 0.5)",
          }}
        >
          <Text className="text-6xl text-center mt-8">☀️</Text>
          <Text className="text-center text-yellow-800 font-bold mt-2">
            SUNNY
          </Text>
        </View>

        {/* Shadow Zone */}
        <View
          className="absolute rounded-2xl"
          style={{
            left: 20,
            bottom: 200,
            width: 150,
            height: 150,
            backgroundColor: "rgba(51, 65, 85, 0.4)",
          }}
        >
          <Text className="text-4xl text-center mt-10">🌑</Text>
          <Text className="text-center text-slate-300 font-bold mt-2">
            TOO DARK
          </Text>
        </View>

        {/* Draggable Plant */}
        <Animated.View
          style={[
            {
              position: "absolute",
              left: plantPosition.x,
              top: plantPosition.y,
              transform: [
                { scale: plantScale },
                { rotate: `${plantRotate.value}deg` },
              ],
            },
          ]}
        >
          <View
            style={
              {
                ...webStyles,
                padding: 10,
              } as any
            }
            {...panResponderSafe.panHandlers}
          >
            <Text style={{ fontSize: 60, lineHeight: 70 }}>🪴</Text>
            <Text className="text-xs text-center font-bold text-slate-600 mt-1">
              DRAG ME!
            </Text>
          </View>
        </Animated.View>

        {/* Wrong Choices */}
        <View className="absolute bottom-32 left-4 right-4">
          <Text className="text-center text-slate-700 font-bold mb-2">
            Wrong choices:
          </Text>
          <View className="flex-row justify-center gap-2 flex-wrap">
            {WRONG_CHOICES.sunlight.map((choice, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleWrongChoice("sunlight", choice)}
                className="p-3 rounded-xl border-2 border-red-300"
                style={{ backgroundColor: "#fee2e2" }}
              >
                <Text className="text-2xl">{choice.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ruko Guide */}
        <View
          className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl flex-row items-center"
          style={{
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <LivingRuko emotion={rukoEmotion} size={60} />
          <Text className="flex-1 ml-4 text-slate-800 font-semibold">
            {rukoMessage}
          </Text>
        </View>
      </View>
    );
  }

  // WATER MINI-GAME
  if (phase === "water") {
    return (
      <View className="flex-1 bg-blue-100">
        <GameBackButton onPress={() => setPhase("menu")} />

        {/* Plant */}
        <View className="absolute top-1/3 left-1/2 -ml-12">
          <Animated.View style={{ transform: [{ scale: plantScale }] }}>
            <Text style={{ fontSize: 70, lineHeight: 80 }}>🌱</Text>
          </Animated.View>
          <View
            className="h-4 rounded-full mt-2 overflow-hidden w-24"
            style={{ backgroundColor: "#bfdbfe" }}
          >
            <View
              className="h-full"
              style={{ width: `${waterScore}%`, backgroundColor: "#3b82f6" }}
            />
          </View>
          <Text className="text-center text-xs text-blue-800 mt-1">
            Water: {waterScore}%
          </Text>
        </View>

        {/* Tap area - FIXED: Changed View to Pressable for Web support */}
        <Pressable
          style={
            {
              position: "absolute",
              top: 80,
              left: 16,
              right: 16,
              height: 160,
              borderRadius: 24,
              borderWidth: 4,
              borderColor: "#93c5fd",
              borderStyle: "dashed",
              backgroundColor: "#eff6ff",
              alignItems: "center",
              justifyContent: "center",
              ...webStyles, // <--- Fixes text selection
              ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
            } as any
          }
          onPress={(e) =>
            addWaterDrop(e.nativeEvent.pageX, e.nativeEvent.pageY)
          }
        >
          <Text className="text-4xl mb-2">👆</Text>
          <Text className="text-blue-600 font-bold">
            TAP HERE TO ADD WATER!
          </Text>
          <Text className="text-blue-400 text-sm mt-1">
            Not too much, not too little!
          </Text>
        </Pressable>

        {/* Drain Button */}
        <TouchableOpacity
          onPress={decreaseWater}
          style={
            {
              position: "absolute",
              right: 20,
              top: 280,
              backgroundColor: "#ef4444",
              padding: 12,
              borderRadius: 30,
              zIndex: 50,
              ...webStyles,
            } as any
          }
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>- Drain</Text>
        </TouchableOpacity>

        {/* Falling drops */}
        {waterDrops.map((drop) => (
          <FallingWaterDrop
            key={drop.id}
            x={drop.x}
            y={drop.y}
            onFinish={() =>
              setWaterDrops((prev) => prev.filter((d) => d.id !== drop.id))
            }
          />
        ))}

        {/* Wrong Choices */}
        <View className="absolute bottom-40 left-4 right-4">
          <Text className="text-center text-slate-700 font-bold mb-2">
            Don't use these:
          </Text>
          <View className="flex-row justify-center gap-3">
            {WRONG_CHOICES.water.map((choice, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleWrongChoice("water", choice)}
                className="p-4 rounded-2xl border-2 border-red-300"
                style={
                  {
                    backgroundColor: "#fee2e2",
                    ...webStyles, // <--- Fixes text selection
                    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
                  } as any
                }
              >
                <Text className="text-3xl">{choice.emoji}</Text>
                <Text className="text-xs text-center text-red-700 mt-1">
                  {choice.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ruko */}
        <View
          className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl flex-row items-center"
          style={{
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <LivingRuko emotion={rukoEmotion} size={60} />
          <Text className="flex-1 ml-4 text-slate-800 font-semibold">
            {rukoMessage}
          </Text>
        </View>
      </View>
    );
  }

  // CO2 MINI-GAME
  if (phase === "co2") {
    return (
      <View className="flex-1 bg-slate-200">
        <GameBackButton onPress={() => setPhase("menu")} />

        {/* Plant */}
        <View className="absolute top-1/3 left-1/2 -ml-16">
          <Text style={{ fontSize: 70, lineHeight: 80 }}>🌿</Text>
          <View
            className="h-4 rounded-full mt-2 overflow-hidden w-32"
            style={{ backgroundColor: "#cbd5e1" }}
          >
            <View
              className="h-full"
              style={{ width: `${co2Score}%`, backgroundColor: "#64748b" }}
            />
          </View>
          <Text className="text-center text-xs text-slate-700 mt-1">
            CO₂: {co2Score}%
          </Text>
        </View>

        {/* Decrease CO2 Button */}
        <TouchableOpacity
          onPress={decreaseCO2}
          style={
            {
              position: "absolute",
              right: 20,
              top: "45%",
              backgroundColor: "#ef4444",
              padding: 12,
              borderRadius: 30,
              zIndex: 50,
              ...webStyles,
            } as any
          }
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>- Vent</Text>
        </TouchableOpacity>

        {/* CO2 Controls */}
        <View className="absolute top-20 left-4 right-4">
          <Text className="text-center text-slate-700 font-bold mb-4">
            Add CO₂ bubbles:
          </Text>
          <View className="flex-row justify-center gap-4">
            <TouchableOpacity
              onPress={() => addCO2Bubble("small")}
              className="p-4 rounded-full"
              style={
                {
                  backgroundColor: "#94a3b8",
                  ...webStyles, // <--- Fixes text selection
                  ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
                } as any
              }
            >
              <Text className="text-2xl">🫧</Text>
              <Text className="text-xs text-white text-center mt-1">Small</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => addCO2Bubble("medium")}
              className="p-5 rounded-full"
              style={
                {
                  backgroundColor: "#64748b",
                  ...webStyles, // <--- Fixes text selection
                  ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
                } as any
              }
            >
              <Text className="text-3xl">💨</Text>
              <Text className="text-xs text-white text-center mt-1">Good</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => addCO2Bubble("large")}
              className="p-6 rounded-full"
              style={
                {
                  backgroundColor: "#475569",
                  ...webStyles, // <--- Fixes text selection
                  ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
                } as any
              }
            >
              <Text className="text-4xl">🌫️</Text>
              <Text className="text-xs text-white text-center mt-1">
                Too much
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bubbles */}
        {co2Bubbles.map((bubble) => (
          <RisingBubble
            key={bubble.id}
            x={bubble.x}
            y={bubble.y}
            size={bubble.size}
            onFinish={() =>
              setCo2Bubbles((prev) => prev.filter((b) => b.id !== bubble.id))
            }
          />
        ))}

        {/* Wrong Choices */}
        <View className="absolute bottom-40 left-4 right-4">
          <Text className="text-center text-slate-700 font-bold mb-2">
            Wrong gases:
          </Text>
          <View className="flex-row justify-center gap-3">
            {WRONG_CHOICES.co2.map((choice, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleWrongChoice("co2", choice)}
                className="p-3 rounded-xl border-2 border-red-300"
                style={
                  {
                    backgroundColor: "#fee2e2",
                    ...webStyles, // <--- Fixes text selection
                    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
                  } as any
                }
              >
                <Text className="text-2xl">{choice.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ruko */}
        <View
          className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl flex-row items-center"
          style={{
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <LivingRuko emotion={rukoEmotion} size={60} />
          <Text className="flex-1 ml-4 text-slate-800 font-semibold">
            {rukoMessage}
          </Text>
        </View>
      </View>
    );
  }

  // QUIZ SCREEN
  if (phase === "quiz") {
    const currentQ = QUIZ_QUESTIONS[difficulty][currentQuizIndex];

    return (
      <View className="flex-1 p-6" style={{ backgroundColor: "#faf5ff" }}>
        <GameBackButton onPress={() => setPhase("menu")} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          <Text className="text-2xl font-bold text-purple-800 text-center mb-2">
            🧠 Knowledge Check
          </Text>
          <Text className="text-purple-600 text-center mb-6">
            Question {currentQuizIndex + 1} of{" "}
            {QUIZ_QUESTIONS[difficulty].length}
          </Text>

          <LivingRuko emotion={rukoEmotion} size={100} />

          <View
            className="p-6 rounded-3xl mt-6 mb-6"
            style={{
              backgroundColor: "white",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text className="text-xl font-bold text-slate-800 mb-4 text-center">
              {currentQ.question}
            </Text>

            {showingExplanation && (
              <Animated.View
                entering={FadeIn}
                className="p-4 rounded-2xl mb-4"
                style={{ backgroundColor: "#fef3c7" }}
              >
                <Text className="text-amber-800 text-center">
                  {currentQ.explanation}
                </Text>
              </Animated.View>
            )}
          </View>

          <View className="space-y-3">
            {currentQ.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => !showingExplanation && handleQuizAnswer(idx)}
                disabled={showingExplanation}
                className={`p-5 rounded-2xl border-2 ${
                  showingExplanation && idx === currentQ.correctIndex
                    ? "border-green-500"
                    : showingExplanation
                      ? "border-slate-200 opacity-50"
                      : "border-purple-200"
                }`}
                style={
                  {
                    backgroundColor:
                      showingExplanation && idx === currentQ.correctIndex
                        ? "#dcfce7"
                        : showingExplanation
                          ? "#f1f5f9"
                          : "white",
                    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
                  } as any
                }
              >
                <Text
                  className={`text-lg font-semibold text-center ${
                    showingExplanation && idx === currentQ.correctIndex
                      ? "text-green-800"
                      : "text-slate-800"
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            className="mt-6 px-6 py-3 rounded-full self-center"
            style={{ backgroundColor: "#f3e8ff" }}
          >
            <Text className="text-purple-800 font-bold">
              Score: {quizScore}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // SUCCESS SCREEN
  if (phase === "success") {
    const mistakesCount = gameState.mistakes.length;
    const grade = mistakesCount === 0 ? "A+" : mistakesCount < 3 ? "B" : "C";

    return (
      <LinearGradient colors={["#fef9c3", "#dcfce7"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Animated.View entering={FadeIn} className="items-center">
            <Text className="text-6xl mb-2">🏆</Text>
            <Text className="text-5xl font-extrabold text-emerald-600 mb-2">
              {grade} Grade!
            </Text>

            <Text className="text-8xl mb-4">🌻</Text>

            <LivingRuko emotion="excited" size={120} />

            <View
              className="p-6 rounded-3xl mt-6 w-full"
              style={{
                backgroundColor: "white",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-2xl font-bold text-emerald-800 text-center mb-4">
                Final Score: {quizScore + gameState.plantHealth}
              </Text>

              {mistakesCount > 0 && (
                <View
                  className="p-4 rounded-2xl mb-4"
                  style={{ backgroundColor: "#fef2f2" }}
                >
                  <Text className="text-red-800 font-bold mb-2">
                    Mistakes made:
                  </Text>
                  {gameState.mistakes.map((m, i) => (
                    <Text key={i} className="text-red-600 text-sm">
                      • {m}
                    </Text>
                  ))}
                </View>
              )}

              <View
                className="p-4 rounded-2xl"
                style={{ backgroundColor: "#ecfdf5" }}
              >
                <Text className="text-emerald-900 font-bold mb-2">
                  What you learned:
                </Text>
                <Text className="text-emerald-700 text-sm leading-5">
                  ☀️ Plants need sunlight for energy{"\n"}
                  💧 Water helps transport nutrients{"\n"}
                  🌬️ CO₂ is plant food from air{"\n"}
                  🍃 Leaves make sugar (glucose){"\n"}
                  💨 Oxygen is released for us to breathe!
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 mt-8">
              <TouchableOpacity
                onPress={resetGame}
                className="px-6 py-4 rounded-2xl"
                style={
                  {
                    backgroundColor: "#6366f1",
                    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
                  } as any
                }
              >
                <Text className="text-white font-bold">🔄 Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onBack}
                className="px-6 py-4 rounded-2xl"
                style={
                  {
                    backgroundColor: "#10b981",
                    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
                  } as any
                }
              >
                <Text className="text-white font-bold">✓ Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return null;
}
