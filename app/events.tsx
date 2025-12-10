import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import EventCard from "../components/EventCard";
import { Evento, getEventos } from "../services/api";

export default function InfoScreen() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const data = await getEventos();
      setEventos(data);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleEventPress = (evento: Evento) => {
    router.push({
      pathname: "/event-detail",
      params: {
        evento: JSON.stringify(evento),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Eventos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Eventos</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {eventos.map((evento, index) => (
          <EventCard
            key={evento.id}
            nombre={evento.nombre}
            fechaInicio={formatDate(evento.fecha_inicio)}
            fechaFin={formatDate(evento.fecha_fin)}
            espacio={evento.nombre_espacio}
            color={colors[index % colors.length]}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});