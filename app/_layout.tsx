import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <>
      {/* Forzar modo claro: status bar con iconos/oscuridad */}
      <StatusBar style="dark" />

      <Stack>
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="event-detail"
          options={{
            title: "Detalle del Evento",
            headerStyle: { backgroundColor: "#ffffff" },
            headerTintColor: "#000000",
            headerTitleAlign: "center",
            headerTitleStyle: { color: "#000000" },
          }}
        />
      </Stack>
    </>
  );
}
