import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  BounceIn,
} from 'react-native-reanimated';
import LivingRuko from '../../components/ruko/LivingRuko';
import { Audio } from 'expo-av';
import { useUserStore } from '../../store/userStore';
import * as AI from '../../services/ai/educationAI';

type GamePhase =
  | 'intro'
  | 'tutorial'
  | 'free-experiment'
  | 'guided-challenge'
  | 'quiz'
  | 'success';

interface ExperimentAttempt {
  hasSun: boolean;
  hasWater: boolean;
  hasCO2: boolean;
  timestamp: number;
}

export default function PhotosynthesisGame({ onBack }: { onBack: () => void }) {
  const { age, addXP, addCoins, updateClassProgress, level } = useUserStore();

  const [phase, setPhase] = useState<GamePhase>('intro');
  const [rukoEmotion, setRukoEmotion] = useState<'happy' | 'thinking' | 'excited' | 'sad'>('happy');
  const [rukoMessage, setRukoMessage] = useState("Hi! Ready to learn how plants eat?");

  // Experiment state
  const [hasSun, setHasSun] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  const [hasCO2, setHasCO2] = useState(false);
  const [plantStage, setPlantStage] = useState(0);
  const [attempts, setAttempts] = useState<ExperimentAttempt[]>([]);

  // AI-generated content
  const [scenarios, setScenarios] = useState<AI.PlantingScenario[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<AI.QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load AI content on mount
  useEffect(() => {
    loadAIContent();
  }, []);

  const loadAIContent = async () => {
    setIsLoading(true);
    try {
      const [scenariosData, quizData] = await Promise.all([
        AI.generatePlantingScenarios(level),
        AI.generateQuiz('photosynthesis', getDifficultyForLevel(level), age, 5)
      ]);

      setScenarios(scenariosData);
      setQuizQuestions(quizData);
    } catch (error) {
      console.error('AI content loading error:', error);
    }
    setIsLoading(false);
  };

  const getDifficultyForLevel = (lvl: number): 'easy' | 'medium' | 'hard' => {
    if (lvl < 3) return 'easy';
    if (lvl < 6) return 'medium';
    return 'hard';
  };

  const playSound = async (type: 'pop' | 'success' | 'wrong' | 'correct') => {
    if (Platform.OS === 'web') return;

    try {
      const sources = {
        pop: require('../../../assets/audio/sfx/pop.mp3'),
        success: require('../../../assets/audio/sfx/success.wav'),
        wrong: require('../../../assets/audio/sfx/wrong.mp3'),
        correct: require('../../../assets/audio/sfx/correct.mp3'),
      };

      const { sound } = await Audio.Sound.createAsync(sources[type]);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      // Silent fail
    }
  };

  const handleExperiment = async () => {
    const attempt: ExperimentAttempt = {
      hasSun,
      hasWater,
      hasCO2,
      timestamp: Date.now()
    };

    setAttempts([...attempts, attempt]);

    // Count ingredients
    const ingredientCount = [hasSun, hasWater, hasCO2].filter(Boolean).length;

    if (hasSun && hasWater && hasCO2) {
      // SUCCESS!
      setPlantStage(3);
      setRukoEmotion('excited');
      playSound('success');

      const dialogue = await AI.getRukoDialogue(
        'Student successfully grew a plant with all correct ingredients',
        'excited',
        age
      );
      setRukoMessage(dialogue || '🎉 Amazing! You did it! The plant is making food through photosynthesis!');

      addXP(50);
      addCoins(10);

      setTimeout(() => {
        setPhase('quiz');
        setRukoMessage("Now let's see what you learned! Ready for a quiz?");
      }, 3000);

    } else {
      // Partial or failure - Get AI guidance
      setPlantStage(ingredientCount);

      if (ingredientCount === 0) {
        setRukoEmotion('sad');
        setRukoMessage("Oops! The plant needs something to grow. Try adding ingredients!");
      } else {
        setRukoEmotion('thinking');

        const missingItems = [];
        if (!hasSun) missingItems.push('sunlight');
        if (!hasWater) missingItems.push('water');
        if (!hasCO2) missingItems.push('CO₂');

        const guidance = await AI.getRukoDialogue(
          `Student added ${ingredientCount} out of 3 ingredients. Missing: ${missingItems.join(', ')}`,
          'encouraging',
          age
        );

        setRukoMessage(guidance || `Good start! But the plant still needs: ${missingItems.join(', ')}`);
      }
    }
  };

  const handleQuizAnswer = async (selectedIndex: number) => {
    const currentQ = quizQuestions[currentQuizIndex];

    if (selectedIndex === currentQ.correctIndex) {
      // Correct!
      playSound('correct');
      setRukoEmotion('excited');
      setQuizScore(prev => prev + 20);
      addXP(20);

      setRukoMessage(currentQ.explanation);

      setTimeout(() => {
        if (currentQuizIndex < quizQuestions.length - 1) {
          setCurrentQuizIndex(prev => prev + 1);
          setRukoEmotion('happy');
          setRukoMessage("Great! Next question...");
        } else {
          // Quiz complete!
          setPhase('success');
          updateClassProgress('science', 'photosynthesis', true, quizScore + 20);
        }
      }, 2500);

    } else {
      // Wrong answer
      playSound('wrong');
      setRukoEmotion('sad');

      const guidance = await AI.getAIGuidance(
        'photosynthesis',
        currentQ.question,
        currentQ.options[selectedIndex],
        currentQ.options[currentQ.correctIndex],
        age
      );

      setRukoMessage(guidance || currentQ.rukoHint);

      setTimeout(() => {
        setRukoEmotion('happy');
      }, 2000);
    }
  };

  const resetExperiment = () => {
    setHasSun(false);
    setHasWater(false);
    setHasCO2(false);
    setPlantStage(0);
  };

  const getPlantEmoji = () => {
    const stages = ['🫘', '🌱', '🌿', '🌻'];
    return stages[plantStage] || '🫘';
  };

  // INTRO SCREEN
  if (phase === 'intro') {
    return (
      <View className="flex-1 bg-gradient-to-b from-sky-100 to-emerald-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={FadeIn.duration(500)} className="items-center">
            <LivingRuko emotion="happy" size={160} onPress={() => setRukoEmotion('excited')} />

            <Text className="text-4xl font-extrabold text-emerald-800 mt-6 text-center">
              🌱 Plant Science Lab
            </Text>

            <View className="bg-white/95 p-6 rounded-3xl mt-6 shadow-lg">
              <Text className="text-xl font-bold text-indigo-600 mb-3 text-center">
                "I'm Ruko! Let me teach you how plants make food!" 🤖
              </Text>

              <Text className="text-lg text-slate-700 leading-7">
                Plants don't eat like we do - they MAKE their own food using a super cool process!
                {'\n\n'}
                Today, you'll run real experiments to discover the secret recipe! 🔬
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setPhase('tutorial');
                setRukoEmotion('excited');
              }}
              className="bg-emerald-500 px-12 py-5 rounded-full mt-8 shadow-lg border-b-4 border-emerald-700 active:border-b-0 active:mt-[34px]"
            >
              <Text className="text-white font-bold text-2xl">Start Experiment! 🚀</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} className="mt-6 px-6 py-3">
              <Text className="text-slate-500 font-semibold">← Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // TUTORIAL PHASE
  if (phase === 'tutorial') {
    return (
      <View className="flex-1 bg-gradient-to-b from-blue-100 to-emerald-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={SlideInDown.springify()} className="items-center">

            <LivingRuko emotion="thinking" size={120} onPress={() => setRukoEmotion('excited')} />

            <View className="bg-white/95 p-8 rounded-3xl mt-6 shadow-xl">
              <Text className="text-2xl font-bold text-blue-600 mb-4 text-center">
                🔬 How The Experiment Works
              </Text>

              <Text className="text-lg text-slate-700 leading-7 mb-4">
                You'll see a seed below. Your job is to figure out what it needs to grow!
                {'\n\n'}
                Try different combinations of:
              </Text>

              <View className="space-y-2">
                <Text className="text-base text-slate-700">☀️ <Text className="font-bold">Sunlight</Text> - Energy from the sun</Text>
                <Text className="text-base text-slate-700">💧 <Text className="font-bold">Water</Text> - From the ground</Text>
                <Text className="text-base text-slate-700">💨 <Text className="font-bold">CO₂</Text> - Gas from the air</Text>
              </View>

              <Text className="text-lg text-slate-700 leading-7 mt-4">
                {'\n'}Tap the cards to add ingredients, then press "Try Growing!" to see what happens!
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setPhase('free-experiment');
                setRukoMessage("Try different combinations! See what works!");
              }}
              className="bg-blue-500 px-12 py-5 rounded-full mt-8 shadow-lg border-b-4 border-blue-700 active:border-b-0 active:mt-[34px]"
            >
              <Text className="text-white font-bold text-2xl">Got it! Let's Experiment!</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // FREE EXPERIMENT PHASE
  if (phase === 'free-experiment') {
    return (
      <View className="flex-1 bg-gradient-to-b from-sky-200 to-emerald-50">

        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-12 pb-4">
          <TouchableOpacity
            onPress={onBack}
            className="bg-white/90 p-3 rounded-full shadow-sm"
          >
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-emerald-800">🧪 Experiment</Text>

          <TouchableOpacity
            onPress={resetExperiment}
            className="bg-amber-100 px-4 py-2 rounded-full"
          >
            <Text className="text-sm font-bold text-amber-800">🔄 Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Plant Display */}
          <View className="items-center my-8">
            <Animated.View key={plantStage} entering={BounceIn.duration(400)}>
              <Text style={{ fontSize: 140 }}>{getPlantEmoji()}</Text>
            </Animated.View>
            <Text className="text-6xl mt-2">🪴</Text>

            <View className="bg-emerald-100 px-6 py-2 rounded-full mt-3">
              <Text className="text-emerald-800 font-bold">
                {plantStage === 0 ? 'Seed' : plantStage === 1 ? 'Sprouting...' : plantStage === 2 ? 'Growing...' : '🌟 Healthy Plant!'}
              </Text>
            </View>
          </View>

          {/* Current Ingredients Display */}
          <View className="mx-6 mb-4">
            <Text className="text-center text-sm font-semibold text-slate-600 mb-2">
              Current Ingredients:
            </Text>
            <View className="flex-row justify-center gap-2">
              {hasSun && <Text className="text-3xl">☀️</Text>}
              {hasWater && <Text className="text-3xl">💧</Text>}
              {hasCO2 && <Text className="text-3xl">💨</Text>}
              {!hasSun && !hasWater && !hasCO2 && (
                <Text className="text-slate-400">None yet...</Text>
              )}
            </View>
          </View>

          {/* Ruko's Message */}
          <Animated.View
            key={rukoMessage}
            entering={FadeIn.duration(300)}
            className="mx-6 mb-6"
          >
            <View className="flex-row items-center bg-white/95 p-5 rounded-3xl shadow-lg">
              <LivingRuko
                emotion={rukoEmotion}
                size={70}
                onPress={() => setRukoEmotion('excited')}
              />
              <View className="flex-1 ml-4">
                <Text className="text-emerald-900 font-bold text-base leading-6">
                  {rukoMessage}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Ingredient Cards */}
          <View className="px-6 mb-4">
            <Text className="text-center text-sm font-semibold text-emerald-700 mb-3">
              TAP TO ADD INGREDIENTS
            </Text>

            <View className="flex-row justify-center gap-3 mb-4">
              <TouchableOpacity
                onPress={() => {
                  playSound('pop');
                  setHasSun(!hasSun);
                }}
                className={`flex-1 max-w-[110px] p-5 rounded-2xl border-b-4 active:border-b-0 active:mt-1 shadow-sm ${
                  hasSun
                    ? 'bg-yellow-300 border-yellow-600'
                    : 'bg-white border-slate-300'
                }`}
              >
                <Text className="text-5xl mb-2 text-center">☀️</Text>
                <Text className={`font-bold text-center text-sm ${hasSun ? 'text-yellow-900' : 'text-slate-600'}`}>
                  Sunlight
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  playSound('pop');
                  setHasWater(!hasWater);
                }}
                className={`flex-1 max-w-[110px] p-5 rounded-2xl border-b-4 active:border-b-0 active:mt-1 shadow-sm ${
                  hasWater
                    ? 'bg-blue-300 border-blue-600'
                    : 'bg-white border-slate-300'
                }`}
              >
                <Text className="text-5xl mb-2 text-center">💧</Text>
                <Text className={`font-bold text-center text-sm ${hasWater ? 'text-blue-900' : 'text-slate-600'}`}>
                  Water
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  playSound('pop');
                  setHasCO2(!hasCO2);
                }}
                className={`flex-1 max-w-[110px] p-5 rounded-2xl border-b-4 active:border-b-0 active:mt-1 shadow-sm ${
                  hasCO2
                    ? 'bg-slate-300 border-slate-600'
                    : 'bg-white border-slate-300'
                }`}
              >
                <Text className="text-5xl mb-2 text-center">💨</Text>
                <Text className={`font-bold text-center text-xs ${hasCO2 ? 'text-slate-900' : 'text-slate-600'}`}>
                  CO₂
                </Text>
              </TouchableOpacity>
            </View>

            {/* Try Growing Button */}
            <TouchableOpacity
              onPress={handleExperiment}
              className="bg-emerald-500 py-5 rounded-2xl shadow-lg border-b-4 border-emerald-700 active:border-b-0 active:mt-1"
            >
              <Text className="text-white font-bold text-xl text-center">
                🌱 Try Growing!
              </Text>
            </TouchableOpacity>

            {/* Attempts Counter */}
            <View className="mt-4 bg-blue-50 p-3 rounded-xl">
              <Text className="text-center text-sm text-blue-800">
                Experiments tried: {attempts.length}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // QUIZ PHASE
  if (phase === 'quiz' && quizQuestions.length > 0) {
    const currentQ = quizQuestions[currentQuizIndex];

    return (
      <View className="flex-1 bg-gradient-to-b from-purple-100 to-pink-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#8B5CF6" />
          ) : (
            <Animated.View entering={FadeIn.duration(400)} className="items-center">

              <Text className="text-3xl font-bold text-purple-800 mb-4 text-center">
                🧠 Knowledge Check
              </Text>

              <Text className="text-lg text-purple-600 mb-4">
                Question {currentQuizIndex + 1} of {quizQuestions.length}
              </Text>

              <LivingRuko emotion={rukoEmotion} size={100} onPress={() => setRukoEmotion('excited')} />

              <View className="bg-white/95 p-6 rounded-3xl mt-4 shadow-lg mb-6 w-full">
                <Text className="text-xl font-bold text-slate-800 mb-4 text-center">
                  {currentQ.question}
                </Text>

                <Animated.View entering={FadeIn}>
                  <Text className="text-base text-indigo-600 italic text-center">
                    💡 {rukoMessage}
                  </Text>
                </Animated.View>
              </View>

              <View className="w-full space-y-3">
                {currentQ.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleQuizAnswer(index)}
                    className="bg-white p-5 rounded-2xl shadow-md border-2 border-purple-200 active:scale-95"
                  >
                    <Text className="text-lg text-slate-800 font-semibold text-center">
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mt-6 bg-purple-100 px-6 py-3 rounded-full">
                <Text className="text-purple-800 font-bold">
                  Score: {quizScore} points
                </Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    );
  }

  // SUCCESS SCREEN
  if (phase === 'success') {
    return (
      <View className="flex-1 bg-gradient-to-b from-yellow-100 to-green-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={FadeIn.duration(500)} className="items-center">

            <Text className="text-6xl mb-4">🎉</Text>
            <Text className="text-5xl font-extrabold text-emerald-600 text-center mb-6">
              Plant Scientist!
            </Text>

            <Text style={{ fontSize: 120 }}>🌻</Text>

            <LivingRuko emotion="excited" size={140} onPress={() => setRukoEmotion('happy')} />

            <View className="bg-white/95 p-8 rounded-3xl mt-6 shadow-xl w-full">
              <Text className="text-2xl font-bold text-emerald-800 text-center mb-4">
                ⭐ Final Score: {quizScore} points
              </Text>

              <View className="bg-emerald-50 p-4 rounded-2xl mb-4">
                <Text className="text-lg font-bold text-emerald-900 text-center mb-3">
                  🌿 What You Learned:
                </Text>
                <Text className="text-base text-slate-700 leading-7">
                  ✅ Photosynthesis = Making food with light{'\n'}
                  ✅ Need: Sun ☀️ + Water 💧 + CO₂ 💨{'\n'}
                  ✅ Makes: Glucose 🍬 + Oxygen 💨{'\n'}
                  ✅ Happens in leaves with chlorophyll!
                </Text>
              </View>

              <View className="bg-blue-50 p-4 rounded-2xl">
                <Text className="text-center text-blue-800">
                  Experiments: {attempts.length} | Lessons Completed: 1
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 mt-8">
              <TouchableOpacity
                onPress={() => {
                  setPhase('intro');
                  resetExperiment();
                  setAttempts([]);
                  setQuizScore(0);
                  setCurrentQuizIndex(0);
                  loadAIContent();
                }}
                className="bg-indigo-500 px-8 py-4 rounded-full shadow-lg border-b-4 border-indigo-700 active:border-b-0 active:mt-1"
              >
                <Text className="text-white font-bold text-lg">🔄 Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onBack}
                className="bg-emerald-500 px-8 py-4 rounded-full shadow-lg border-b-4 border-emerald-700 active:border-b-0 active:mt-1"
              >
                <Text className="text-white font-bold text-lg">✓ Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return null;
}
