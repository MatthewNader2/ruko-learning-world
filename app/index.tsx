// app/index.tsx
import { useRootNavigationState, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LivingRuko from "../src/components/ruko/LivingRuko";
import { useAudioStore } from "../src/store/audioStore";
import { useUserStore } from "../src/store/userStore";

const { width } = Dimensions.get("window");

// Enhanced Interest Options with colors
const INTERESTS = [
  { id: "space", label: "Space", emoji: "🚀", color: "#8b5cf6" },
  { id: "dinos", label: "Dinosaurs", emoji: "🦖", color: "#10b981" },
  { id: "art", label: "Art & Design", emoji: "🎨", color: "#f43f5e" },
  { id: "coding", label: "Coding", emoji: "💻", color: "#6366f1" },
  { id: "animals", label: "Animals", emoji: "🦁", color: "#f59e0b" },
  { id: "music", label: "Music", emoji: "🎵", color: "#ec4899" },
];

const STEPS = [
  { title: "Welcome", emoji: "👋" },
  { title: "Name", emoji: "✏️" },
  { title: "Age", emoji: "🎂" },
  { title: "Interests", emoji: "⭐" },
  { title: "Style", emoji: "🎯" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { setUserProfile, hasCompletedOnboarding } = useUserStore();
  const { isMuted, toggleMute } = useAudioStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState<
    "visual" | "reading" | "mixed"
  >("mixed");
  const [isReady, setIsReady] = useState(false);
  const [rukoEmotion, setRukoEmotion] = useState<
    "happy" | "excited" | "thinking" | "listening"
  >("happy");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rukoBounce = useRef(new Animated.Value(0)).current;

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

  // Animate step transitions
  useEffect(() => {
    // Update emotion based on step
    if (step === 4) setRukoEmotion("listening");
    else if (step === 5) setRukoEmotion("thinking");
    else setRukoEmotion("happy");

    // Ruko bounce animation (Keep this, it's safe)
    rukoBounce.setValue(0); // Reset before animating
    Animated.spring(rukoBounce, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const animateStepChange = (direction: "next" | "back") => {
    // 1. Fade out and Slide away
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === "next" ? -50 : 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Change Step (State Update)
      if (direction === "next") setStep((s) => Math.min(s + 1, 5));
      else setStep((s) => Math.max(s - 1, 1));

      // 3. Reset Slide instantly
      slideAnim.setValue(direction === "next" ? 50 : -50);

      // 4. Fade in and Slide back to 0
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (step < 5) animateStepChange("next");
    else finishOnboarding();
  };

  const handleBack = () => {
    if (step > 1) animateStepChange("back");
  };

  const toggleInterest = (id: string) => {
    // Excitement animation
    setRukoEmotion("excited");
    setTimeout(() => setRukoEmotion(step === 4 ? "listening" : "happy"), 800);

    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const finishOnboarding = () => {
    if (!name.trim())
      return Alert.alert("Wait!", "Please tell Ruko your name!");
    if (!age.trim() || isNaN(parseInt(age)))
      return Alert.alert("Wait!", "Please enter a valid age!");

    setUserProfile(
      name.trim(),
      parseInt(age),
      selectedInterests,
      learningStyle,
    );
    router.replace("/home");
  };

  if (!isReady) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View className="items-center px-4">
            <Text className="text-4xl font-extrabold text-indigo-600 mb-4 text-center tracking-tight">
              Hi! I'm Ruko!
            </Text>
            <Text className="text-lg text-slate-500 text-center mb-10 leading-relaxed max-w-xs">
              I'm your AI learning companion. Let's explore Science, Coding, and
              more together!
            </Text>
            <TouchableOpacity
              onPress={handleNext}
              className="bg-indigo-600 w-full max-w-xs py-4 rounded-2xl"
              style={{
                shadowColor: "#6366f1",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="text-white font-bold text-xl text-center">
                Let's Start! 🚀
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View className="w-full max-w-xs mx-auto">
            <Text className="text-3xl font-bold text-slate-800 mb-2 text-center">
              What's your name?
            </Text>
            <Text className="text-slate-400 text-center mb-8">
              Ruko wants to know what to call you
            </Text>

            <TextInput
              className="bg-white p-5 rounded-2xl text-2xl text-center text-slate-800 border-2 border-indigo-100 mb-8 font-semibold"
              placeholder="Enter your name..."
              placeholderTextColor="#cbd5e1"
              value={name}
              onChangeText={setName}
              autoFocus={Platform.OS === "web"}
              maxLength={20}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 bg-slate-200 py-4 rounded-2xl"
              >
                <Text className="text-slate-600 font-bold text-lg text-center">
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                disabled={!name.trim()}
                className={`flex-[2] py-4 rounded-2xl ${name.trim() ? "bg-indigo-600" : "bg-slate-300"}`}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Continue ➡️
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View className="w-full max-w-xs mx-auto items-center">
            <Text className="text-3xl font-bold text-slate-800 mb-2 text-center">
              How old are you?
            </Text>
            <Text className="text-slate-400 text-center mb-8">
              This helps Ruko personalize your experience
            </Text>

            <View className="flex-row justify-center mb-8">
              <TextInput
                className="bg-white w-32 h-32 rounded-3xl text-6xl text-center font-bold text-indigo-600 border-4 border-indigo-100"
                placeholder="8"
                placeholderTextColor="#c7d2fe"
                keyboardType="number-pad"
                maxLength={2}
                value={age}
                onChangeText={(text) => {
                  // Only allow numbers
                  if (/^\d*$/.test(text)) setAge(text);
                }}
              />
            </View>

            <Text className="text-slate-400 text-sm mb-8">years old</Text>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 bg-slate-200 py-4 rounded-2xl"
              >
                <Text className="text-slate-600 font-bold text-lg text-center">
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                disabled={!age}
                className={`flex-[2] py-4 rounded-2xl ${age ? "bg-indigo-600" : "bg-slate-300"}`}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Continue ➡️
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4:
        return (
          <View className="w-full px-4">
            <Text className="text-3xl font-bold text-slate-800 mb-2 text-center">
              What interests you?
            </Text>
            <Text className="text-slate-400 text-center mb-6">
              Pick all that spark your curiosity
            </Text>

            <View className="flex-row flex-wrap justify-center gap-3 mb-8">
              {INTERESTS.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleInterest(item.id)}
                    className={`px-4 py-3 rounded-2xl border-2 flex-row items-center gap-2 ${isSelected
                        ? "border-transparent"
                        : "bg-white border-slate-100"
                      }`}
                    style={{
                      backgroundColor: isSelected ? item.color : "white",
                      shadowColor: isSelected ? item.color : "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.3 : 0.05,
                      shadowRadius: 4,
                      elevation: isSelected ? 4 : 1,
                    }}
                  >
                    <Text className="text-2xl">{item.emoji}</Text>
                    <Text
                      className={`font-bold ${isSelected ? "text-white" : "text-slate-600"}`}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Text className="text-white ml-1">✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 bg-slate-200 py-4 rounded-2xl"
              >
                <Text className="text-slate-600 font-bold text-lg text-center">
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNext}
                className="flex-[2] bg-indigo-600 py-4 rounded-2xl"
                style={{
                  shadowColor: "#6366f1",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Continue ➡️
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5:
        return (
          <View className="w-full px-4">
            <Text className="text-3xl font-bold text-slate-800 mb-2 text-center">
              How do you learn best?
            </Text>
            <Text className="text-slate-400 text-center mb-8">
              Ruko will adapt to your style
            </Text>

            <TouchableOpacity
              onPress={() => setLearningStyle("visual")}
              className={`p-5 mb-4 rounded-2xl border-2 flex-row items-center ${learningStyle === "visual"
                  ? "border-violet-500"
                  : "bg-white border-slate-100"
                }`}
              style={{
                backgroundColor:
                  learningStyle === "visual" ? "#f5f3ff" : "white",
                shadowColor: learningStyle === "visual" ? "#8b5cf6" : "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: learningStyle === "visual" ? 0.1 : 0.05,
                shadowRadius: 4,
                elevation: learningStyle === "visual" ? 2 : 1,
              }}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: "#ede9fe" }}
              >
                <Text className="text-2xl">👁️</Text>
              </View>
              <View className="flex-1">
                <Text
                  className={`text-lg font-bold mb-1 ${learningStyle === "visual"
                      ? "text-violet-900"
                      : "text-slate-800"
                    }`}
                >
                  Visual Learner
                </Text>
                <Text className="text-slate-500 text-sm">
                  I learn best with images, videos, and diagrams
                </Text>
              </View>
              {learningStyle === "visual" && (
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#8b5cf6" }}
                >
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLearningStyle("reading")}
              className={`p-5 mb-4 rounded-2xl border-2 flex-row items-center ${learningStyle === "reading"
                  ? "border-blue-500"
                  : "bg-white border-slate-100"
                }`}
              style={{
                backgroundColor:
                  learningStyle === "reading" ? "#eff6ff" : "white",
                shadowColor: learningStyle === "reading" ? "#3b82f6" : "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: learningStyle === "reading" ? 0.1 : 0.05,
                shadowRadius: 4,
                elevation: learningStyle === "reading" ? 2 : 1,
              }}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: "#dbeafe" }}
              >
                <Text className="text-2xl">📖</Text>
              </View>
              <View className="flex-1">
                <Text
                  className={`text-lg font-bold mb-1 ${learningStyle === "reading"
                      ? "text-blue-900"
                      : "text-slate-800"
                    }`}
                >
                  Reading Learner
                </Text>
                <Text className="text-slate-500 text-sm">
                  I prefer reading stories, facts, and explanations
                </Text>
              </View>
              {learningStyle === "reading" && (
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#3b82f6" }}
                >
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLearningStyle("mixed")}
              className={`p-5 mb-8 rounded-2xl border-2 flex-row items-center ${learningStyle === "mixed"
                  ? "border-emerald-500"
                  : "bg-white border-slate-100"
                }`}
              style={{
                backgroundColor:
                  learningStyle === "mixed" ? "#ecfdf5" : "white",
                shadowColor: learningStyle === "mixed" ? "#10b981" : "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: learningStyle === "mixed" ? 0.1 : 0.05,
                shadowRadius: 4,
                elevation: learningStyle === "mixed" ? 2 : 1,
              }}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: "#d1fae5" }}
              >
                <Text className="text-2xl">🔄</Text>
              </View>
              <View className="flex-1">
                <Text
                  className={`text-lg font-bold mb-1 ${learningStyle === "mixed"
                      ? "text-emerald-900"
                      : "text-slate-800"
                    }`}
                >
                  Mixed Style
                </Text>
                <Text className="text-slate-500 text-sm">
                  I like a combination of both
                </Text>
              </View>
              {learningStyle === "mixed" && (
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#10b981" }}
                >
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 bg-slate-200 py-4 rounded-2xl"
              >
                <Text className="text-slate-600 font-bold text-lg text-center">
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={finishOnboarding}
                className="flex-[2] bg-emerald-500 py-4 rounded-2xl"
                style={{
                  shadowColor: "#10b981",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text className="text-white font-bold text-xl text-center">
                  Start Learning! 🌟
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <TouchableOpacity
        onPress={toggleMute}
        className="absolute top-12 right-6 z-50 bg-white/80 p-2 rounded-full shadow-sm"
      >
        <Text className="text-xl">{isMuted ? "🔇" : "🔊"}</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Steps */}
          <View className="px-8 pt-12 pb-6">
            <View className="flex-row justify-between items-center mb-2">
              {STEPS.map((s, idx) => (
                <View key={idx} className="items-center">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center border-2 ${step > idx + 1
                        ? "bg-indigo-600 border-indigo-600"
                        : step === idx + 1
                          ? "bg-white border-indigo-600"
                          : "bg-slate-100 border-slate-200"
                      }`}
                  >
                    <Text
                      className={`text-lg ${step > idx + 1
                          ? "text-white"
                          : step === idx + 1
                            ? "text-indigo-600"
                            : "text-slate-400"
                        }`}
                    >
                      {step > idx + 1 ? "✓" : s.emoji}
                    </Text>
                  </View>
                  {idx < STEPS.length - 1 && (
                    <View
                      className={`absolute h-0.5 w-8 top-5 left-8 ${step > idx + 1 ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                    />
                  )}
                </View>
              ))}
            </View>
            <View className="flex-row justify-between px-1">
              {STEPS.map((s, idx) => (
                <Text
                  key={idx}
                  className={`text-xs font-medium ${step === idx + 1 ? "text-indigo-600" : "text-slate-400"
                    }`}
                >
                  {s.title}
                </Text>
              ))}
            </View>
          </View>

          {/* Animated Ruko */}
          <View className="items-center mb-6">
            <Animated.View
              style={{
                transform: [
                  {
                    translateY: rukoBounce.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    }),
                  },
                ],
              }}
            >
              <LivingRuko
                emotion={rukoEmotion}
                size={160}
                onPress={() => {
                  setRukoEmotion("excited");
                  setTimeout(
                    () =>
                      setRukoEmotion(
                        step === 4
                          ? "listening"
                          : step === 5
                            ? "thinking"
                            : "happy",
                      ),
                    800,
                  );
                }}
              />
            </Animated.View>
          </View>

          {/* Step Content */}
          <Animated.View
            className="flex-1 justify-center pb-12"
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateX: slideAnim,
                },
              ],
            }}
          >
            {renderStepContent()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
