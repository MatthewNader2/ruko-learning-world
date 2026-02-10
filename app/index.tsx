import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useRootNavigationState } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserStore } from "../src/store/userStore";
import LivingRuko from "../src/components/ruko/LivingRuko"; // Updated import

// Interest Options
const INTERESTS = [
  { id: "space", label: "Space", emoji: "🚀" },
  { id: "dinos", label: "Dinos", emoji: "🦖" },
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "coding", label: "Coding", emoji: "💻" },
  { id: "animals", label: "Animals", emoji: "🦁" },
  { id: "music", label: "Music", emoji: "🎵" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { setUserProfile, hasCompletedOnboarding } = useUserStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState<
    "visual" | "reading" | "mixed"
  >("mixed");
  const [isReady, setIsReady] = useState(false);
  const [rukoEmotion, setRukoEmotion] = useState<"happy" | "excited" | "thinking" | "listening">("happy"); // Added state

  // Web/Native Navigation Check
  useEffect(() => {
    if (Platform.OS === "web" || rootNavigationState?.key) {
      setIsReady(true);
    }
  }, [rootNavigationState]);

  // Redirect if already done
  useEffect(() => {
    if (isReady && hasCompletedOnboarding) {
      const timer = setTimeout(() => router.replace("/home"), 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, hasCompletedOnboarding]);

  // Update Ruko's emotion based on current step
  useEffect(() => {
    if (step === 4) {
      setRukoEmotion("listening");
    } else if (step === 5) {
      setRukoEmotion("thinking");
    } else {
      setRukoEmotion("happy");
    }
  }, [step]);

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else finishOnboarding();
  };

  const toggleInterest = (id: string) => {
    // Trigger excitement briefly when interests change
    setRukoEmotion("excited");
    setTimeout(() => {
      // Return to appropriate emotion based on step
      setRukoEmotion(step === 4 ? "listening" : "happy");
    }, 1000);

    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const finishOnboarding = () => {
    if (!name || !age)
      return Alert.alert("Wait!", "Ruko needs your name and age!");
    setUserProfile(name, parseInt(age), selectedInterests, learningStyle);
    router.replace("/home");
  };

  if (!isReady) return <ActivityIndicator size="large" className="flex-1" />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        {/* Progress Bar */}
        <View className="flex-row h-2 bg-slate-200 rounded-full mb-8 mx-4">
          <View
            className="bg-indigo-500 h-2 rounded-full"
            style={{ width: `${step * 20}%` }}
          />
        </View>

        {/* Interactive Living Ruko */}
        <View className="items-center mb-8">
          <LivingRuko
            emotion={rukoEmotion}
            size={180}
            onPress={() => {
              setRukoEmotion("excited");
              setTimeout(() => {
                setRukoEmotion(step === 4 ? "listening" : step === 5 ? "thinking" : "happy");
              }, 800);
            }}
          />
        </View>

        {/* --- STEP 1: INTRO --- */}
        {step === 1 && (
          <View className="items-center">
            <Text className="text-4xl font-extrabold text-indigo-600 mb-4 text-center">
              Hi! I'm Ruko!
            </Text>
            <Text className="text-lg text-slate-500 text-center mb-8">
              I'm your AI friend. I can help you learn Science, Coding, and
              more!
            </Text>
            <TouchableOpacity
              onPress={handleNext}
              className="bg-indigo-600 w-full py-4 rounded-2xl shadow-lg"
            >
              <Text className="text-white font-bold text-xl text-center">
                Let's Go! 🚀
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- STEP 2: NAME --- */}
        {step === 2 && (
          <View className="w-full">
            <Text className="text-3xl font-bold text-slate-800 mb-2 text-center">
              What's your name?
            </Text>
            <TextInput
              className="bg-white p-5 rounded-2xl text-2xl text-center text-indigo-900 border-2 border-indigo-100 mb-8"
              placeholder="Type name here..."
              value={name}
              onChangeText={setName}
              autoFocus={Platform.OS === "web"}
            />
            <TouchableOpacity
              onPress={handleNext}
              className="bg-indigo-600 w-full py-4 rounded-2xl shadow-lg"
            >
              <Text className="text-white font-bold text-xl text-center">
                Next ➡️
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- STEP 3: AGE --- */}
        {step === 3 && (
          <View className="w-full items-center">
            <Text className="text-3xl font-bold text-slate-800 mb-2 text-center">
              How old are you?
            </Text>
            <View className="flex-row justify-center mb-8">
              <TextInput
                className="bg-white w-32 h-32 rounded-full text-5xl text-center font-bold text-indigo-600 border-4 border-indigo-100"
                placeholder="8"
                keyboardType="numeric"
                maxLength={2}
                value={age}
                onChangeText={setAge}
              />
            </View>
            <TouchableOpacity
              onPress={handleNext}
              className="bg-indigo-600 w-full py-4 rounded-2xl shadow-lg"
            >
              <Text className="text-white font-bold text-xl text-center">
                Next ➡️
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- STEP 4: INTERESTS --- */}
        {step === 4 && (
          <View className="w-full">
            <Text className="text-3xl font-bold text-slate-800 mb-2 text-center">
              What do you like?
            </Text>
            <Text className="text-slate-400 text-center mb-6">
              Pick as many as you want!
            </Text>

            <View className="flex-row flex-wrap justify-center gap-3 mb-8">
              {INTERESTS.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleInterest(item.id)}
                    className={`w-[45%] p-4 rounded-xl border-2 flex-row items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-amber-100 border-amber-400"
                        : "bg-white border-slate-100"
                    }`}
                  >
                    <Text className="text-2xl">{item.emoji}</Text>
                    <Text
                      className={`font-bold ${isSelected ? "text-amber-800" : "text-slate-600"}`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={handleNext}
              className="bg-indigo-600 w-full py-4 rounded-2xl shadow-lg"
            >
              <Text className="text-white font-bold text-xl text-center">
                Next ➡️
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- STEP 5: LEARNING STYLE --- */}
        {step === 5 && (
          <View className="w-full">
            <Text className="text-3xl font-bold text-slate-800 mb-6 text-center">
              How do you learn?
            </Text>

            <TouchableOpacity
              onPress={() => setLearningStyle("visual")}
              className={`p-6 mb-4 rounded-2xl border-2 ${learningStyle === "visual" ? "bg-purple-100 border-purple-500" : "bg-white border-slate-100"}`}
            >
              <Text className="text-xl font-bold text-purple-900 mb-1">
                👀 I like Pictures & Videos
              </Text>
              <Text className="text-slate-500">Show me how it works!</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLearningStyle("reading")}
              className={`p-6 mb-8 rounded-2xl border-2 ${learningStyle === "reading" ? "bg-blue-100 border-blue-500" : "bg-white border-slate-100"}`}
            >
              <Text className="text-xl font-bold text-blue-900 mb-1">
                📖 I like Reading
              </Text>
              <Text className="text-slate-500">
                I want to read stories and facts.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={finishOnboarding}
              className="bg-emerald-500 w-full py-4 rounded-2xl shadow-lg"
            >
              <Text className="text-white font-bold text-xl text-center">
                Start Adventure! 🌟
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
