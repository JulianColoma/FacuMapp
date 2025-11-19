import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <>
      {/* Forzar modo claro: status bar con iconos/oscuridad */}
      <StatusBar style="dark" />

      <Tabs
        screenOptions={({ route }) => ({
          headerShown: true,
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#000000",
          headerTitleAlign: "center",
          headerTitleStyle: { color: "#000000" },

          tabBarActiveTintColor: "#0a84ff",
          tabBarInactiveTintColor: "#8e8e93",
          tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#e6e6e6" },

          tabBarIcon: ({ color, size }) => {
            let name: React.ComponentProps<typeof Ionicons>["name"] = "ellipse";
            if (route.name === "index") name = "map";
            else if (route.name === "events") name = "calendar";
            return <Ionicons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Mapa" }} />
        <Tabs.Screen name="events" options={{ title: "Eventos" }} />
      </Tabs>
    </>
  );
}