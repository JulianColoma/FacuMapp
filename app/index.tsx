import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import InteractiveMap from "../components/InteractiveMap";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <InteractiveMap />
    </SafeAreaView>
  );
}
