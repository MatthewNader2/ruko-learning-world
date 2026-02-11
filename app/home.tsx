// app/home.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { useUserStore } from "../src/store/userStore";
import RukoAvatar from "../src/components/ruko/RukoAvatar";
import PhotosynthesisGame from "../src/features/science-class/PhotosynthesisGame";
import RukoChat from "../src/features/shared/RukoChat";
import CodingGame from "../src/features/coding-class/CodingGame";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 56) / 2;

type ActiveScreen =
  | { type: "home" }
  | { type: "science-game" }
  | { type: "coding-game" }
  | { type: "chat"; className: "science" | "coding" | "history" };

// --- Reanimated ClassCard ---
// Self-contained component to prevent parent re-render crashes
const ClassCard = ({
  title,
  subtitle,
  color,
  accentColor,
  icon,
  onPressLearn,
  onPressChat,
  emoji,
  isLocked = false,
}: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      style={[{ width: CARD_WIDTH, marginBottom: 32 }, animatedStyle]}
    >
      <Pressable
        onPress={onPressLearn}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => ({
          borderRadius: 24,
          overflow: "hidden",
          opacity: isLocked ? 0.8 : 1,
          backgroundColor: "white",
          ...Platform.select({
            web: { boxShadow: `0px 4px 8px ${accentColor}33` },
            default: {
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            },
          }),
        })}
      >
        <View className={`${color} p-5 h-36 justify-between`}>
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
          >
            {icon ? (
              <Image source={icon} className="w-7 h-7" resizeMode="contain" />
            ) : (
              <Text className="text-2xl">{emoji}</Text>
            )}
          </View>

          <View>
            <Text className="font-bold text-base text-slate-800 leading-tight">
              {title}
            </Text>
            <Text
              className="text-slate-600 text-xs mt-1"
              style={{ opacity: 0.8 }}
            >
              {isLocked ? "Locked • Coming soon" : subtitle}
            </Text>
          </View>

          <View className="absolute top-4 right-4">
            {isLocked ? (
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
              >
                <Text className="text-xs">🔒</Text>
              </View>
            ) : (
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
              >
                <Text className="text-xs">▶</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {/* Chat Button */}
      {!isLocked && (
        <Pressable
          onPress={onPressChat}
          style={({ pressed }) => ({
            marginTop: 16,
            backgroundColor: "white",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#f1f5f9",
            opacity: pressed ? 0.7 : 1,
            ...Platform.select({
              web: { boxShadow: "0px 2px 4px rgba(0,0,0,0.05)" },
              default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              },
            }),
          })}
        >
          <Text style={{ fontSize: 14, marginRight: 8 }}>💬</Text>
          <Text className="text-slate-700 font-semibold text-xs">
            Chat with Ruko
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
};
// --------------------------------

export default function HomeScreen() {
  const { name, reset, level, xp } = useUserStore();
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>({
    type: "home",
  });

  const handleSciencePress = useCallback(() => {
    console.log("Science pressed - navigating to game");
    setActiveScreen({ type: "science-game" });
  }, []);

  const handleChatPress = useCallback(
    (className: "science" | "coding" | "history") => {
      console.log("Chat pressed for", className);
      setActiveScreen({ type: "chat", className });
    },
    [],
  );

  const handleResetPress = useCallback(() => {
    console.log("Reset pressed");
    Alert.alert(
      "Reset Progress?",
      "This will delete your profile, level, and all progress.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await useUserStore.persist.clearStorage();
            reset();
            router.replace("/");
          },
        },
      ],
    );
  }, [reset, router]);

  // Render active screen logic...
  if (activeScreen.type === "science-game") {
    return (
      <View style={{ flex: 1 }}>
        <PhotosynthesisGame onBack={() => setActiveScreen({ type: "home" })} />
      </View>
    );
  }

  if (activeScreen.type === "coding-game") {
    return (
      <View style={{ flex: 1 }}>
        <CodingGame onBack={() => setActiveScreen({ type: "home" })} />
      </View>
    );
  }

  if (activeScreen.type === "chat") {
    return (
      <RukoChat
        className={activeScreen.className}
        onBack={() => setActiveScreen({ type: "home" })}
      />
    );
  }

  const xpToNextLevel = Math.pow(level + 1, 2) * 100;
  const currentLevelXP = xp;
  const progress = Math.min((currentLevelXP / xpToNextLevel) * 100, 100);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-8">
          <View className="flex-1">
            <Text className="text-slate-400 font-medium text-base mb-1">
              Welcome back,
            </Text>
            <Text className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {name || "Explorer"}! 👋
            </Text>
          </View>

          <View className="items-center">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center border-4 border-white"
              style={{
                backgroundColor: "#6366f1",
                ...Platform.select({
                  web: { boxShadow: "0px 4px 8px rgba(99,102,241,0.3)" },
                  default: {
                    shadowColor: "#6366f1",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  },
                }),
              }}
            >
              <Text className="text-white font-extrabold text-2xl">
                {level}
              </Text>
            </View>
            <Text className="text-indigo-600 font-bold text-xs mt-2 uppercase tracking-wider">
              Level
            </Text>
          </View>
        </View>

        {/* XP Progress Card */}
        <View
          className="bg-white p-5 rounded-3xl mb-8 border border-slate-100"
          style={Platform.select({
            web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" },
            default: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            },
          })}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-slate-600 font-semibold text-sm">
              Progress to Level {level + 1}
            </Text>
            <Text className="text-indigo-600 font-bold text-sm">
              {Math.round(progress)}%
            </Text>
          </View>

          <View className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: "#6366f1",
              }}
            />
          </View>

          <Text className="text-slate-400 text-xs mt-2 text-center">
            {currentLevelXP} / {xpToNextLevel} XP
          </Text>
        </View>

        {/* Ruko's Message */}
        <Pressable
          onPress={() => console.log("Ruko pressed")}
          style={({ pressed }) => ({
            backgroundColor: "#6366f1",
            borderRadius: 24,
            padding: 24,
            marginBottom: 40,
            overflow: "hidden",
            position: "relative",
            opacity: pressed ? 0.9 : 1,
            ...Platform.select({
              web: {
                cursor: "pointer",
                boxShadow: "0px 8px 16px rgba(99,102,241,0.25)",
              },
              default: {
                shadowColor: "#6366f1",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 8,
              },
            }),
          })}
        >
          <View
            className="absolute rounded-full"
            style={{
              top: -40,
              right: -40,
              width: 128,
              height: 128,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          />
          <View
            className="absolute rounded-full"
            style={{
              bottom: -32,
              left: -32,
              width: 96,
              height: 96,
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          />

          <View className="flex-row items-center relative z-10">
            <View className="mr-4">
              <RukoAvatar emotion="happy" size={80} />
            </View>
            <View className="flex-1">
              <View
                className="p-4 rounded-2xl rounded-tl-none"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                <Text className="text-white font-bold text-lg leading-6">
                  "Ready to learn something amazing today?"
                </Text>
              </View>
              <Text className="text-xs mt-2 ml-1" style={{ color: "#c7d2fe" }}>
                Tap me to say hello!
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Section Title */}
        <View className="flex-row items-center mb-5">
          <View
            className="rounded-full mr-3"
            style={{ width: 4, height: 24, backgroundColor: "#6366f1" }}
          />
          <Text className="text-xl font-bold text-slate-800">
            Explore Classes
          </Text>
        </View>

        {/* Class Cards */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <ClassCard
            id="science"
            title="Science Lab"
            subtitle="Interactive experiments"
            color="bg-emerald-100"
            accentColor="#10b981"
            icon={require("../assets/images/icons/science.png")}
            onPressLearn={handleSciencePress}
            onPressChat={() => handleChatPress("science")}
          />

          <ClassCard
            id="coding"
            title="Code World"
            subtitle="Build & create"
            color="bg-violet-100"
            accentColor="#8b5cf6"
            icon={require("../assets/images/icons/coding.png")}
            onPressLearn={() => setActiveScreen({ type: "coding-game" })}
            onPressChat={() => handleChatPress("coding")}
            isLocked={false}
          />

          <ClassCard
            id="history"
            title="Time Travel"
            subtitle="Explore the past"
            color="bg-amber-100"
            accentColor="#f59e0b"
            icon={require("../assets/images/icons/history.png")}
            onPressLearn={() => {}}
            onPressChat={() => handleChatPress("history")}
            isLocked={true}
          />

          <ClassCard
            id="teach"
            title="Teach Ruko"
            subtitle="Share knowledge"
            color="bg-rose-100"
            accentColor="#f43f5e"
            emoji="🎓"
            onPressLearn={() => {}}
            onPressChat={() =>
              Alert.alert(
                "Coming Soon",
                "Voice teaching feature launching soon!",
              )
            }
            isLocked={true}
          />
        </View>

        {/* Stats Dashboard */}
        <View
          className="bg-white p-6 rounded-3xl mt-8 border border-slate-100"
          style={Platform.select({
            web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.05)" },
            default: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            },
          })}
        >
          <Text className="text-lg font-bold text-slate-800 mb-5">
            Your Journey
          </Text>

          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                style={{ backgroundColor: "rgba(99,102,241,0.1)" }}
              >
                <Text className="text-2xl">⭐</Text>
              </View>
              <Text className="text-2xl font-extrabold text-indigo-600">
                {level}
              </Text>
              <Text className="text-slate-500 text-xs font-medium">Level</Text>
            </View>

            <View className="items-center flex-1">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
              >
                <Text className="text-2xl">📚</Text>
              </View>
              <Text className="text-2xl font-extrabold text-emerald-600">
                {useUserStore.getState().totalLessonsCompleted || 0}
              </Text>
              <Text className="text-slate-500 text-xs font-medium">
                Lessons
              </Text>
            </View>

            <View className="items-center flex-1">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                style={{ backgroundColor: "rgba(245,158,11,0.1)" }}
              >
                <Text className="text-2xl">🪙</Text>
              </View>
              <Text className="text-2xl font-extrabold text-amber-600">
                {useUserStore.getState().coins || 0}
              </Text>
              <Text className="text-slate-500 text-xs font-medium">Coins</Text>
            </View>
          </View>
        </View>

        {/* Reset Button */}
        <Pressable
          onPress={handleResetPress}
          style={({ pressed }) => ({
            marginTop: 40,
            marginBottom: 24,
            padding: 16,
            alignSelf: "center",
            opacity: pressed ? 0.6 : 1,
            ...Platform.select({ web: { cursor: "pointer" } }),
          })}
        >
          <Text className="text-slate-400 font-medium text-sm">
            Reset Profile
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
