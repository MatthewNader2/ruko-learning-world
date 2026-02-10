import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  BounceIn,
} from 'react-native-reanimated';
import LivingRuko from '../../components/ruko/LivingRuko';
import { Audio } from 'expo-av';

type GamePhase =
  | 'intro'
  | 'learn-sun'
  | 'learn-water'
  | 'learn-co2'
  | 'quiz-ingredients'
  | 'quiz-order'
  | 'celebration'
  | 'explanation';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  rukoHint: string;
}

export default function PhotosynthesisGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [rukoEmotion, setRukoEmotion] = useState<'happy' | 'thinking' | 'excited' | 'sad'>('happy');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentPlantStage, setCurrentPlantStage] = useState(0); // 0: seed, 1: sprout, 2: small, 3: flower

  // Safe audio player
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
      console.log('Audio error:', error);
    }
  };

  // Story progression
  const nextPhase = () => {
    const phaseOrder: GamePhase[] = [
      'intro',
      'learn-sun',
      'learn-water',
      'learn-co2',
      'quiz-ingredients',
      'quiz-order',
      'celebration'
    ];

    const currentIndex = phaseOrder.indexOf(phase);
    if (currentIndex < phaseOrder.length - 1) {
      setPhase(phaseOrder[currentIndex + 1]);
      playSound('pop');
    }
  };

  // Quiz data
  const ingredientsQuiz: Question = {
    question: "What do plants need to make their own food?",
    options: [
      "Sunlight, Water, Pizza 🍕",
      "Sunlight, Water, CO₂ 💨",
      "Sunlight, Soda, Candy 🍬",
      "Moon, Coffee, Music 🎵"
    ],
    correctIndex: 1,
    explanation: "Plants need Sunlight ☀️, Water 💧, and Carbon Dioxide (CO₂) 💨 from the air!",
    rukoHint: "Think about what you learned! The air we breathe out has CO₂!"
  };

  const orderQuiz: Question = {
    question: "What do plants MAKE during photosynthesis?",
    options: [
      "Pizza and Cookies 🍕🍪",
      "Glucose (Sugar) & Oxygen 🍬💨",
      "Water and Sunlight 💧☀️",
      "Carbon Dioxide 💨"
    ],
    correctIndex: 1,
    explanation: "Plants make Glucose (a type of sugar for food) and Oxygen (which we breathe)! They're like tiny food factories! 🏭",
    rukoHint: "Remember: Plants TAKE IN CO₂ and MAKE oxygen for us!"
  };

  const handleQuizAnswer = (selectedIndex: number, quiz: Question) => {
    if (selectedIndex === quiz.correctIndex) {
      playSound('correct');
      setRukoEmotion('excited');
      setScore(prev => prev + 50);
      setCurrentPlantStage(prev => Math.min(prev + 1, 3));
      setTimeout(() => {
        nextPhase();
      }, 2000);
    } else {
      playSound('wrong');
      setRukoEmotion('sad');
      setAttempts(prev => prev + 1);
      setTimeout(() => {
        setRukoEmotion('happy');
      }, 1500);
    }
  };

  // Plant emoji based on stage
  const getPlantEmoji = () => {
    const stages = ['🫘', '🌱', '🌿', '🌻'];
    return stages[currentPlantStage];
  };

  // Render plant growth area
  const PlantDisplay = () => (
    <Animated.View
      key={currentPlantStage}
      entering={BounceIn.duration(600)}
      className="items-center mb-6"
    >
      <Text style={{ fontSize: 120 }}>{getPlantEmoji()}</Text>
      <Text className="text-6xl">🪴</Text>
      <View className="bg-emerald-100 px-4 py-2 rounded-full mt-2">
        <Text className="text-emerald-800 font-bold">Stage {currentPlantStage}/3</Text>
      </View>
    </Animated.View>
  );

  // INTRO SCREEN
  if (phase === 'intro') {
    return (
      <View className="flex-1 bg-gradient-to-b from-sky-100 to-emerald-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={FadeIn.duration(500)} className="items-center">
            <LivingRuko emotion="happy" size={160} />

            <Text className="text-4xl font-extrabold text-emerald-800 mt-6 text-center">
              🌱 How Plants Eat
            </Text>

            <View className="bg-white/95 p-6 rounded-3xl mt-6 shadow-lg">
              <Text className="text-xl font-bold text-indigo-600 mb-3 text-center">
                "Hi! I'm Ruko! Let me teach you something AMAZING!" 🤖
              </Text>

              <Text className="text-lg text-slate-700 leading-7">
                Did you know plants don't eat food like we do?
                {'\n\n'}
                They MAKE their own food using a magic trick called
                <Text className="font-bold text-emerald-600"> PHOTOSYNTHESIS</Text>!
                {'\n\n'}
                Let me show you how! 🔬✨
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                nextPhase();
                setRukoEmotion('excited');
              }}
              className="bg-emerald-500 px-12 py-5 rounded-full mt-8 shadow-lg border-b-4 border-emerald-700 active:border-b-0 active:mt-[34px]"
            >
              <Text className="text-white font-bold text-2xl">Let's Learn! 🚀</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} className="mt-6 px-6 py-3">
              <Text className="text-slate-500 font-semibold">← Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // LEARN SUNLIGHT
  if (phase === 'learn-sun') {
    return (
      <View className="flex-1 bg-gradient-to-b from-yellow-100 to-sky-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={SlideInDown.springify()} className="items-center">

            <Text className="text-7xl mb-4">☀️</Text>

            <LivingRuko emotion="thinking" size={120} />

            <View className="bg-white/95 p-8 rounded-3xl mt-6 shadow-xl">
              <Text className="text-2xl font-bold text-yellow-600 mb-4 text-center">
                Ingredient #1: SUNLIGHT
              </Text>

              <Text className="text-lg text-slate-700 leading-7">
                <Text className="font-bold">Sunlight</Text> gives plants ENERGY! ⚡
                {'\n\n'}
                Just like you need energy to run and play, plants need energy from the sun to make food!
                {'\n\n'}
                The green parts of plants (called <Text className="font-bold text-green-600">chlorophyll</Text>) catch the sunlight like a solar panel! 🌿
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                nextPhase();
                setCurrentPlantStage(1);
                playSound('success');
              }}
              className="bg-yellow-500 px-12 py-5 rounded-full mt-8 shadow-lg border-b-4 border-yellow-700 active:border-b-0 active:mt-[34px]"
            >
              <Text className="text-white font-bold text-2xl">Got it! ☀️</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // LEARN WATER
  if (phase === 'learn-water') {
    return (
      <View className="flex-1 bg-gradient-to-b from-blue-100 to-sky-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={SlideInDown.springify()} className="items-center">

            <Text className="text-7xl mb-4">💧</Text>

            <LivingRuko emotion="happy" size={120} />

            <View className="bg-white/95 p-8 rounded-3xl mt-6 shadow-xl">
              <Text className="text-2xl font-bold text-blue-600 mb-4 text-center">
                Ingredient #2: WATER
              </Text>

              <Text className="text-lg text-slate-700 leading-7">
                Plants drink water through their <Text className="font-bold text-amber-700">roots</Text>! 🌳
                {'\n\n'}
                The water travels up through the stem to the leaves.
                {'\n\n'}
                Water has special tiny parts called <Text className="font-bold">H₂O</Text> (2 Hydrogen + 1 Oxygen atoms) that plants use to build their food! 🧪
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                nextPhase();
                setCurrentPlantStage(2);
                playSound('success');
              }}
              className="bg-blue-500 px-12 py-5 rounded-full mt-8 shadow-lg border-b-4 border-blue-700 active:border-b-0 active:mt-[34px]"
            >
              <Text className="text-white font-bold text-2xl">Cool! 💧</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // LEARN CO2
  if (phase === 'learn-co2') {
    return (
      <View className="flex-1 bg-gradient-to-b from-slate-100 to-sky-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={SlideInDown.springify()} className="items-center">

            <Text className="text-7xl mb-4">💨</Text>

            <LivingRuko emotion="excited" size={120} />

            <View className="bg-white/95 p-8 rounded-3xl mt-6 shadow-xl">
              <Text className="text-2xl font-bold text-slate-700 mb-4 text-center">
                Ingredient #3: Carbon Dioxide (CO₂)
              </Text>

              <Text className="text-lg text-slate-700 leading-7">
                <Text className="font-bold">CO₂</Text> is a gas in the air! 💨
                {'\n\n'}
                When you breathe OUT, you make CO₂! Then plants breathe it IN through tiny holes in their leaves! 🍃
                {'\n\n'}
                <Text className="font-bold text-emerald-600">Fun Fact:</Text> Plants and humans are a TEAM! We breathe oxygen, they breathe CO₂! 🤝
              </Text>
            </View>

            <TouchableOpacity
              onPress={nextPhase}
              className="bg-slate-500 px-12 py-5 rounded-full mt-8 shadow-lg border-b-4 border-slate-700 active:border-b-0 active:mt-[34px]"
            >
              <Text className="text-white font-bold text-2xl">Amazing! 💨</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // QUIZ: INGREDIENTS
  if (phase === 'quiz-ingredients') {
    return (
      <View className="flex-1 bg-gradient-to-b from-purple-100 to-pink-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={FadeIn.duration(400)} className="items-center">

            <Text className="text-3xl font-bold text-purple-800 mb-4 text-center">
              🧠 Quiz Time!
            </Text>

            <PlantDisplay />

            <LivingRuko emotion={rukoEmotion} size={100} />

            <View className="bg-white/95 p-6 rounded-3xl mt-4 shadow-lg mb-6">
              <Text className="text-xl font-bold text-slate-800 mb-4 text-center">
                {ingredientsQuiz.question}
              </Text>

              {rukoEmotion === 'sad' && attempts > 0 && (
                <Animated.View entering={FadeIn}>
                  <Text className="text-base text-indigo-600 italic text-center mb-3">
                    💡 Hint: {ingredientsQuiz.rukoHint}
                  </Text>
                </Animated.View>
              )}
            </View>

            <View className="w-full space-y-3">
              {ingredientsQuiz.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuizAnswer(index, ingredientsQuiz)}
                  className="bg-white p-5 rounded-2xl shadow-md border-2 border-purple-200 active:scale-95"
                >
                  <Text className="text-lg text-slate-800 font-semibold text-center">
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {rukoEmotion === 'excited' && (
              <Animated.View entering={BounceIn} className="mt-4">
                <Text className="text-2xl text-green-600 font-bold text-center">
                  🎉 Perfect! {ingredientsQuiz.explanation}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // QUIZ: WHAT PLANTS MAKE
  if (phase === 'quiz-order') {
    return (
      <View className="flex-1 bg-gradient-to-b from-green-100 to-blue-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={FadeIn.duration(400)} className="items-center">

            <Text className="text-3xl font-bold text-green-800 mb-4 text-center">
              🧠 Final Question!
            </Text>

            <PlantDisplay />

            <LivingRuko emotion={rukoEmotion} size={100} />

            <View className="bg-white/95 p-6 rounded-3xl mt-4 shadow-lg mb-6">
              <Text className="text-xl font-bold text-slate-800 mb-4 text-center">
                {orderQuiz.question}
              </Text>

              {rukoEmotion === 'sad' && attempts > 1 && (
                <Animated.View entering={FadeIn}>
                  <Text className="text-base text-indigo-600 italic text-center mb-3">
                    💡 Hint: {orderQuiz.rukoHint}
                  </Text>
                </Animated.View>
              )}
            </View>

            <View className="w-full space-y-3">
              {orderQuiz.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuizAnswer(index, orderQuiz)}
                  className="bg-white p-5 rounded-2xl shadow-md border-2 border-green-200 active:scale-95"
                >
                  <Text className="text-lg text-slate-800 font-semibold text-center">
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {rukoEmotion === 'excited' && (
              <Animated.View entering={BounceIn} className="mt-4">
                <Text className="text-2xl text-green-600 font-bold text-center">
                  🎉 Correct! {orderQuiz.explanation}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // CELEBRATION / SUCCESS
  if (phase === 'celebration') {
    return (
      <View className="flex-1 bg-gradient-to-b from-yellow-100 to-green-100 p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Animated.View entering={FadeIn.duration(500)} className="items-center">

            <Text className="text-6xl mb-4">🎉</Text>
            <Text className="text-5xl font-extrabold text-emerald-600 text-center mb-6">
              You're a Plant Scientist!
            </Text>

            <PlantDisplay />

            <LivingRuko emotion="excited" size={140} />

            <View className="bg-white/95 p-8 rounded-3xl mt-6 shadow-xl">
              <Text className="text-2xl font-bold text-emerald-800 text-center mb-4">
                ⭐ Score: {score} points
              </Text>

              <View className="bg-emerald-50 p-4 rounded-2xl">
                <Text className="text-lg font-bold text-emerald-900 text-center mb-3">
                  🌿 The Magic Recipe:
                </Text>
                <Text className="text-base text-slate-700 leading-7">
                  ☀️ Sunlight (Energy){'\n'}
                  💧 Water (H₂O){'\n'}
                  💨 Carbon Dioxide (CO₂){'\n'}
                  {'\n'}
                  <Text className="font-bold">Mix them together →</Text>{'\n'}
                  {'\n'}
                  🍬 Glucose (Plant Food!){'\n'}
                  💨 Oxygen (For us to breathe!)
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 mt-8">
              <TouchableOpacity
                onPress={() => {
                  setPhase('intro');
                  setScore(0);
                  setAttempts(0);
                  setCurrentPlantStage(0);
                  setRukoEmotion('happy');
                }}
                className="bg-indigo-500 px-8 py-4 rounded-full shadow-lg border-b-4 border-indigo-700 active:border-b-0 active:mt-1"
              >
                <Text className="text-white font-bold text-lg">🔄 Play Again</Text>
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
