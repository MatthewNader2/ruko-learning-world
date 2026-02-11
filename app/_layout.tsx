// app/_layout.tsx
import "../global.css";
import { Slot } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View className="flex-1 bg-slate-50">
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}
