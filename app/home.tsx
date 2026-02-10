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
import PhotosynthesisGame from "../src/features/science-class/PhotosynthesisGame"; // Import the game

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

export default function HomeScreen() {
  const { name, reset } = useUserStore();
  const router = useRouter();
  const [activeClass, setActiveClass] = useState<string | null>(null);

  // Render game screen when active
  if (activeClass === "science") {
    return <PhotosynthesisGame onBack={() => setActiveClass(null)} />;
  }

  const handleReset = async () => {
    Alert.alert("Reset App?", "This will delete your name and progress.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          console.log("🗑️ Wiping Data...");
          // 1. Clear Disk
          await useUserStore.persist.clearStorage();
          // 2. Clear Memory (Crucial!)
          reset();
          // 3. Go to Start
          router.replace("/");
        },
      },
    ]);
  };

  const ClassCard = ({ title, color, icon, onPress, emoji }: any) => (
    <TouchableOpacity
      style={{ width: CARD_WIDTH }}
      className={`p-5 rounded-3xl mb-4 shadow-sm border-b-4 active:opacity-80 ${color}`}
      onPress={onPress}
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
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-slate-400 font-medium text-lg">Hello,</Text>
            <Text className="text-3xl font-extrabold text-slate-800">
              {name || "Explorer"}
            </Text>
          </View>
          <TouchableOpacity
            className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center border border-indigo-200"
            onPress={() => Alert.alert("Settings", "Coming soon! 🔧")}
          >
            <Text className="text-xl">⚙️</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-indigo-600 rounded-[40px] p-6 mb-10 flex-row items-center shadow-lg shadow-indigo-200">
          <View className="scale-75 -ml-4">
            <RukoAvatar emotion="happy" />
          </View>
          <View className="flex-1 ml-2">
            <View className="bg-white/10 p-4 rounded-2xl rounded-tl-none">
              <Text className="text-white font-bold text-lg leading-6">
                "I'm bored! Let's learn something new!"
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-xl font-bold text-slate-800 mb-5">
          Explore World
        </Text>

        <View className="flex-row flex-wrap justify-between">
          <ClassCard
            title="Science"
            color="bg-emerald-200 border-emerald-400"
            icon={require("../assets/images/icons/science.png")}
            onPress={() => setActiveClass("science")} // Open Photosynthesis Game
          />
          <ClassCard
            title="Coding"
            color="bg-purple-200 border-purple-400"
            icon={require("../assets/images/icons/coding.png")}
            onPress={() => Alert.alert("Coming Soon", "Coding adventures launching soon! 👨‍💻")}
          />
          <ClassCard
            title="History"
            color="bg-amber-200 border-amber-400"
            icon={require("../assets/images/icons/history.png")}
            onPress={() => Alert.alert("Coming Soon", "Time travel adventures coming soon! ⏳")}
          />
          <ClassCard
            title="Teach Ruko"
            color="bg-rose-200 border-rose-400"
            emoji="🎤"
            onPress={() => Alert.alert("Coming Soon", "Teach Ruko new things soon! 🧠")}
          />
        </View>

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
