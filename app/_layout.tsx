// app/_layout.tsx
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { useBackgroundMusic } from "../src/hooks/useBackgroundMusic";

export default function Layout() {
  useBackgroundMusic();

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View className="flex-1 bg-slate-50">
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}
