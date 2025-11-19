import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function InfoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>Pantalla de ejemplos</Text>
        <Text>Aca vienen los eventos</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
});