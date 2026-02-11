import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUserStore } from "../src/store/userStore";
import RukoAvatar from "../src/components/ruko/RukoAvatar";
import PhotosynthesisGame from "../src/features/science-class/PhotosynthesisGame";
import RukoChat from "../src/features/shared/RukoChat";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

type ActiveScreen =
  | { type: 'home' }
  | { type: 'science-game' }
  | { type: 'chat'; className: 'science' | 'coding' | 'history' };

export default function HomeScreen() {
  const { name, reset, level, xp } = useUserStore();
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>({ type: 'home' });

  // Render active screen
  if (activeScreen.type === 'science-game') {
    return <PhotosynthesisGame onBack={() => setActiveScreen({ type: 'home' })} />;
  }

  if (activeScreen.type === 'chat') {
    return (
      <RukoChat
        className={activeScreen.className}
        onBack={() => setActiveScreen({ type: 'home' })}
      />
    );
  }

  // Home screen
  const handleReset = async () => {
    Alert.alert("Reset App?", "This will delete your name and progress.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          console.log("🗑️ Wiping Data...");
          await useUserStore.persist.clearStorage();
          reset();
          router.replace("/");
        },
      },
    ]);
  };

  const ClassCard = ({
    title,
    color,
    icon,
    onPressLearn,
    onPressChat,
    emoji
  }: any) => (
    <View
      style={{ width: CARD_WIDTH }}
      className="mb-4"
    >
      {/* Main Card */}
      <TouchableOpacity
        className={`p-5 rounded-3xl shadow-sm border-b-4 active:opacity-80 ${color}`}
        onPress={onPressLearn}
        activeOpacity={0.85}
      >
        <View className="bg-white/30 w-14 h-14 rounded-full items-center justify-center mb-3">
          {icon ? (
            <Image source={icon} className="w-8 h-8" resizeMode="contain" />
          ) : (
            <Text className="text-2xl">{emoji}</Text>
          )}
        </View>
        <Text className="font-bold text-lg text-slate-800">{title}</Text>
        <Text className="text-slate-600 text-xs mt-1">Tap to start</Text>
      </TouchableOpacity>

      {/* Chat Button */}
      <TouchableOpacity
        onPress={onPressChat}
        className="bg-white mt-2 px-3 py-2 rounded-xl shadow-sm border border-slate-200 flex-row items-center justify-center active:scale-95"
      >
        <Text className="text-slate-700 font-semibold text-xs mr-1">
          💬 Chat with Ruko
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Calculate XP progress
  const xpToNextLevel = Math.pow(level + 1, 2) * 100;
  const currentLevelXP = xp;
  const progress = (currentLevelXP / xpToNextLevel) * 100;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Header with Level */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-slate-400 font-medium text-lg">Hello,</Text>
            <Text className="text-3xl font-extrabold text-slate-800">
              {name || "Explorer"}
            </Text>
          </View>

          {/* Level Badge */}
          <View className="items-center">
            <View className="bg-indigo-600 w-16 h-16 rounded-full items-center justify-center border-4 border-indigo-200 shadow-lg">
              <Text className="text-white font-extrabold text-xl">{level}</Text>
            </View>
            <Text className="text-indigo-600 font-bold text-xs mt-1">Level</Text>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View className="bg-white p-4 rounded-2xl shadow-sm mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-600 font-semibold text-sm">
              Level Progress
            </Text>
            <Text className="text-indigo-600 font-bold text-sm">
              {currentLevelXP} / {xpToNextLevel} XP
            </Text>
          </View>
          <View className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
        </View>

        {/* Ruko's Message */}
        <View className="bg-indigo-600 rounded-[40px] p-6 mb-10 flex-row items-center shadow-lg shadow-indigo-200">
          <View className="scale-75 -ml-4">
            <RukoAvatar emotion="happy" />
          </View>
          <View className="flex-1 ml-2">
            <View className="bg-white/10 p-4 rounded-2xl rounded-tl-none">
              <Text className="text-white font-bold text-lg leading-6">
                "Ready to learn something new today?"
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-xl font-bold text-slate-800 mb-5">
          Explore Classes
        </Text>

        {/* Class Cards */}
        <View className="flex-row flex-wrap justify-between">
          <ClassCard
            title="Science"
            color="bg-emerald-200 border-emerald-400"
            icon={require("../assets/images/icons/science.png")}
            onPressLearn={() => setActiveScreen({ type: 'science-game' })}
            onPressChat={() => setActiveScreen({ type: 'chat', className: 'science' })}
          />

          <ClassCard
            title="Coding"
            color="bg-purple-200 border-purple-400"
            icon={require("../assets/images/icons/coding.png")}
            onPressLearn={() => Alert.alert("Coming Soon", "Coding adventures launching soon! 💻")}
            onPressChat={() => setActiveScreen({ type: 'chat', className: 'coding' })}
          />

          <ClassCard
            title="History"
            color="bg-amber-200 border-amber-400"
            icon={require("../assets/images/icons/history.png")}
            onPressLearn={() => Alert.alert("Coming Soon", "Time travel adventures coming soon! ⏳")}
            onPressChat={() => setActiveScreen({ type: 'chat', className: 'history' })}
          />

          <ClassCard
            title="Teach Ruko"
            color="bg-rose-200 border-rose-400"
            emoji="🎤"
            onPressLearn={() => Alert.alert("Coming Soon", "Teach Ruko new things soon! 🧠")}
            onPressChat={() => Alert.alert("Teach Ruko", "Use the mic to teach Ruko! Feature coming in Phase 6!")}
          />
        </View>

        {/* Quick Stats */}
        <View className="bg-white p-6 rounded-2xl shadow-sm mt-6">
          <Text className="text-lg font-bold text-slate-800 mb-4">
            📊 Your Stats
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-3xl font-extrabold text-indigo-600">{level}</Text>
              <Text className="text-slate-500 text-xs mt-1">Level</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-3xl font-extrabold text-emerald-600">
                {useUserStore.getState().totalLessonsCompleted || 0}
              </Text>
              <Text className="text-slate-500 text-xs mt-1">Lessons</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-3xl font-extrabold text-amber-600">
                {useUserStore.getState().coins || 0}
              </Text>
              <Text className="text-slate-500 text-xs mt-1">Coins</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <TouchableOpacity
          onPress={handleReset}
          className="mt-10 bg-slate-200 p-4 rounded-xl items-center mb-10"
        >
          <Text className="text-slate-500 font-bold">
            🔄 Reset Profile (Start Over)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
