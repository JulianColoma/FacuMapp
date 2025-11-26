import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import EventCard from "../components/EventCard";

export default function InfoScreen() {
  const eventos = [
    {
      nombre: "Semana de la Ingeniería",
      fechaInicio: "15/03/2025",
      fechaFin: "22/03/2025",
      color: "#3B82F6",
    },
    {
      nombre: "Jornadas de Electrónica",
      fechaInicio: "10/04/2025",
      fechaFin: "12/04/2025",
      color: "#10B981",
    },
    {
      nombre: "Hackathon UTN",
      fechaInicio: "05/05/2025",
      fechaFin: "07/05/2025",
      color: "#F59E0B",
    },
    {
      nombre: "Expo Ingeniería Industrial",
      fechaInicio: "20/05/2025",
      fechaFin: "22/05/2025",
      color: "#8B5CF6",
    },
  ];

  const handleEventPress = (evento: typeof eventos[0]) => {
    // Mostrar toda la información del evento seleccionado en la consola
    console.log("Evento seleccionado:", evento);
    // Si prefieres un JSON legible:
    // console.log("Evento seleccionado (JSON):\n", JSON.stringify(evento, null, 2));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Eventos</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {eventos.map((evento, index) => (
          <EventCard
            key={index}
            nombre={evento.nombre}
            fechaInicio={evento.fechaInicio}
            fechaFin={evento.fechaFin}
            color={evento.color}
            onPress={() => handleEventPress(evento)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
  },
  scrollContent: {
    padding: 16,
  },
});