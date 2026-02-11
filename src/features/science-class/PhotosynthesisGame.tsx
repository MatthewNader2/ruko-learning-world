// src/features/science-class/PhotosynthesisGame.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated as RNAnimated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
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
  sunLevel: number; // 0-100
  waterLevel: number; // 0-100
  co2Level: number; // 0-100
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

// Wrong choices that kids might try
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

// Helper components for safe animations
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
    const anim = RNAnimated.timing(translateY, {
      toValue: 400,
      duration: 800,
      useNativeDriver: true, // EXPLICITLY TRUE
    });

    anim.start(({ finished }) => {
      if (finished) onFinish();
    });

    return () => anim.stop();
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
    const anim = RNAnimated.parallel([
      RNAnimated.timing(translateY, {
        toValue: -200,
        duration: 2000,
        useNativeDriver: true, // EXPLICITLY TRUE
      }),
      RNAnimated.timing(scale, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true, // EXPLICITLY TRUE
      }),
    ]);

    anim.start(({ finished }) => {
      if (finished) onFinish();
    });

    return () => anim.stop();
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
  const { age, addXP, addCoins, level } = useUserStore();
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

  // Game state
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

  const difficultyLevel = level < 3 ? "easy" : level < 6 ? "medium" : "hard";

  useEffect(() => {
    setDifficulty(difficultyLevel);
  }, [difficultyLevel]);

  // Pan responder for dragging plant
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        setPlantPosition({
          x: Math.max(0, Math.min(SCREEN_WIDTH - 80, gestureState.moveX - 40)),
          y: Math.max(
            200,
            Math.min(SCREEN_HEIGHT - 200, gestureState.moveY - 40),
          ),
        });
      },
      onPanResponderRelease: () => {
        checkSunPosition();
      },
    }),
  ).current;

  const checkSunPosition = () => {
    // Sun area is top-right, shadow is bottom-left
    const sunZone = { x: SCREEN_WIDTH * 0.6, y: 250, width: 150, height: 150 };
    const shadowZone = { x: 50, y: 400, width: 150, height: 150 };

    const plantCenter = {
      x: plantPosition.x + 40,
      y: plantPosition.y + 40,
    };

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
  };

  // Water mini-game
  const addWaterDrop = (x: number, y: number) => {
    const newDrop = { id: Date.now(), x, y };
    setWaterDrops((prev) => [...prev, newDrop]);

    // Calculate if drop hits plant
    const plantZone = {
      x: SCREEN_WIDTH / 2 - 50,
      y: 300,
      width: 100,
      height: 100,
    };
    const hitsPlant =
      x > plantZone.x &&
      x < plantZone.x + plantZone.width &&
      y > plantZone.y &&
      y < plantZone.y + plantZone.height;

    if (hitsPlant) {
      setWaterScore((prev) => {
        const newScore = prev + 10;
        if (newScore >= 50 && newScore <= 80) {
          setGameState((s) => ({ ...s, waterLevel: newScore }));
          setRukoMessage("Perfect amount of water! 💧");
          setRukoEmotion("happy");
          setTimeout(() => setPhase("co2"), 1500);
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
        setTimeout(() => setPhase("quiz"), 1500);
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
            className="bg-emerald-100 p-6 rounded-3xl mb-4 border-2 border-emerald-300"
            style={{
              shadowColor: "#10b981",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            }}
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
                <View className="bg-emerald-500 self-start px-3 py-1 rounded-full mt-2">
                  <Text className="text-white text-xs font-bold">
                    AVAILABLE
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Locked Topics */}
          {[
            {
              emoji: "⚡",
              title: "Electricity",
              desc: "Circuits and currents",
              color: "amber",
            },
            {
              emoji: "🔭",
              title: "Space",
              desc: "Planets and stars",
              color: "indigo",
            },
            {
              emoji: "🦕",
              title: "Dinosaurs",
              desc: "Prehistoric life",
              color: "stone",
            },
            {
              emoji: "🧬",
              title: "DNA",
              desc: "Genetics and heredity",
              color: "rose",
            },
          ].map((topic, idx) => (
            <View
              key={idx}
              className={`bg-${topic.color}-50 p-6 rounded-3xl mb-4 border-2 border-${topic.color}-200 opacity-60`}
            >
              <View className="flex-row items-center">
                <Text className="text-4xl mr-4">{topic.emoji}</Text>
                <View className="flex-1">
                  <Text className={`text-xl font-bold text-${topic.color}-800`}>
                    {topic.title}
                  </Text>
                  <Text className={`text-${topic.color}-600 text-sm`}>
                    {topic.desc}
                  </Text>
                  <View
                    className={`bg-${topic.color}-300 self-start px-3 py-1 rounded-full mt-2`}
                  >
                    <Text className="text-white text-xs font-bold">
                      COMING SOON
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl">🔒</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // INTRO SCREEN
  if (phase === "intro") {
    return (
      <View className="flex-1 bg-gradient-to-b from-sky-100 to-emerald-50 p-6">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
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

            <View className="bg-white p-6 rounded-3xl mt-6 shadow-lg">
              <Text className="text-lg text-slate-700 leading-7 text-center">
                Help me grow a healthy plant by giving it exactly what it needs!
                {"\n\n"}
                But be careful - wrong choices will hurt the plant! 😰
              </Text>
            </View>

            <View className="flex-row gap-4 mt-8">
              <TouchableOpacity
                onPress={() => setPhase("sunlight")}
                className="bg-emerald-500 px-8 py-4 rounded-2xl shadow-lg"
              >
                <Text className="text-white font-bold text-lg">Start! 🚀</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPhase("menu")}
                className="bg-slate-200 px-6 py-4 rounded-2xl"
              >
                <Text className="text-slate-600 font-bold">Back</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // SUNLIGHT MINI-GAME
  if (phase === "sunlight") {
    return (
      <View className="flex-1 bg-sky-200" {...panResponder.panHandlers}>
        {/* Sun Zone */}
        <View
          className="absolute bg-yellow-300 rounded-full opacity-50"
          style={{
            right: 20,
            top: 100,
            width: 150,
            height: 150,
          }}
        >
          <Text className="text-6xl text-center mt-8">☀️</Text>
          <Text className="text-center text-yellow-800 font-bold mt-2">
            SUNNY
          </Text>
        </View>

        {/* Shadow Zone */}
        <View
          className="absolute bg-slate-700 rounded-2xl opacity-40"
          style={{
            left: 20,
            bottom: 200,
            width: 150,
            height: 150,
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
          <Text className="text-6xl">🪴</Text>
          <Text className="text-xs text-center font-bold text-slate-600 mt-1">
            DRAG ME!
          </Text>
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
                className="bg-red-100 p-3 rounded-xl border-2 border-red-300"
              >
                <Text className="text-2xl">{choice.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ruko Guide */}
        <View className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-lg flex-row items-center">
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
        {/* Plant */}
        <View className="absolute top-1/3 left-1/2 -ml-12">
          <Animated.View style={{ transform: [{ scale: plantScale }] }}>
            <Text className="text-8xl">🌱</Text>
          </Animated.View>
          <View className="bg-blue-200 h-4 rounded-full mt-2 overflow-hidden w-24">
            <View
              className="bg-blue-500 h-full"
              style={{ width: `${waterScore}%` }}
            />
          </View>
          <Text className="text-center text-xs text-blue-800 mt-1">
            Water: {waterScore}%
          </Text>
        </View>

        {/* Tap area */}
        <View
          className="absolute top-20 left-4 right-4 h-40 bg-blue-50 rounded-3xl border-4 border-blue-300 border-dashed items-center justify-center"
          onTouchStart={(e) =>
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
        </View>

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
                className="bg-red-100 p-4 rounded-2xl border-2 border-red-300"
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
        <View className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-lg flex-row items-center">
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
        {/* Plant */}
        <View className="absolute top-1/3 left-1/2 -ml-16">
          <Text className="text-8xl">🌿</Text>
          <View className="bg-slate-300 h-4 rounded-full mt-2 overflow-hidden w-32">
            <View
              className="bg-slate-500 h-full"
              style={{ width: `${co2Score}%` }}
            />
          </View>
          <Text className="text-center text-xs text-slate-700 mt-1">
            CO₂: {co2Score}%
          </Text>
        </View>

        {/* CO2 Controls */}
        <View className="absolute top-20 left-4 right-4">
          <Text className="text-center text-slate-700 font-bold mb-4">
            Add CO₂ bubbles:
          </Text>
          <View className="flex-row justify-center gap-4">
            <TouchableOpacity
              onPress={() => addCO2Bubble("small")}
              className="bg-slate-400 p-4 rounded-full"
            >
              <Text className="text-2xl">🫧</Text>
              <Text className="text-xs text-white text-center mt-1">Small</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => addCO2Bubble("medium")}
              className="bg-slate-500 p-5 rounded-full"
            >
              <Text className="text-3xl">💨</Text>
              <Text className="text-xs text-white text-center mt-1">Good</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => addCO2Bubble("large")}
              className="bg-slate-600 p-6 rounded-full"
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
                className="bg-red-100 p-3 rounded-xl border-2 border-red-300"
              >
                <Text className="text-2xl">{choice.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ruko */}
        <View className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-lg flex-row items-center">
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
      <View className="flex-1 bg-purple-50 p-6">
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

          <View className="bg-white p-6 rounded-3xl mt-6 shadow-lg mb-6">
            <Text className="text-xl font-bold text-slate-800 mb-4 text-center">
              {currentQ.question}
            </Text>

            {showingExplanation && (
              <Animated.View
                entering={FadeIn}
                className="bg-amber-100 p-4 rounded-2xl mb-4"
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
                    ? "bg-green-100 border-green-500"
                    : showingExplanation
                      ? "bg-slate-100 border-slate-200 opacity-50"
                      : "bg-white border-purple-200"
                }`}
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

          <View className="mt-6 bg-purple-100 px-6 py-3 rounded-full self-center">
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
      <View className="flex-1 bg-gradient-to-b from-yellow-100 to-green-100 p-6">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          <Animated.View entering={FadeIn} className="items-center">
            <Text className="text-6xl mb-2">🏆</Text>
            <Text className="text-5xl font-extrabold text-emerald-600 mb-2">
              {grade} Grade!
            </Text>

            <Text className="text-8xl mb-4">🌻</Text>

            <LivingRuko emotion="excited" size={120} />

            <View className="bg-white p-6 rounded-3xl mt-6 shadow-lg w-full">
              <Text className="text-2xl font-bold text-emerald-800 text-center mb-4">
                Final Score: {quizScore + gameState.plantHealth}
              </Text>

              {mistakesCount > 0 && (
                <View className="bg-red-50 p-4 rounded-2xl mb-4">
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

              <View className="bg-emerald-50 p-4 rounded-2xl">
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
                className="bg-indigo-500 px-6 py-4 rounded-2xl"
              >
                <Text className="text-white font-bold">🔄 Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onBack}
                className="bg-emerald-500 px-6 py-4 rounded-2xl"
              >
                <Text className="text-white font-bold">✓ Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return null;
}
