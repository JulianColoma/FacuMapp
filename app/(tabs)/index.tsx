import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView, StatusBar } from "react-native";
import InteractiveMap from "../../components/InteractiveMap";

export default function App() {
  const params = useLocalSearchParams();
  const initialSpaceId = typeof params.spaceId === "string" ? params.spaceId : undefined;
  const initialSpaceName = typeof params.spaceName === "string" ? params.spaceName : undefined;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <InteractiveMap initialSpaceId={initialSpaceId} initialSpaceName={initialSpaceName} />
    </SafeAreaView>
  );
}
