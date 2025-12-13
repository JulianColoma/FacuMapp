import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Actividad, Evento, Espacio, getActividadesByEvento, getEspacios } from "../services/api";

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActividades, setLoadingActividades] = useState(true);

  useEffect(() => {
    if (params.evento) {
      try {
        const eventoData = JSON.parse(params.evento as string);
        setEvento(eventoData);
        loadActividades(eventoData.id);
      } catch (error) {
        console.error("Error al parsear evento:", error);
      }
    }
    setLoading(false);
  }, [params.evento]);

  const loadActividades = async (eventoId: number) => {
    try {
      setLoadingActividades(true);
      const data = await getActividadesByEvento(eventoId);
      setActividades(data);
    } catch (error) {
      console.error("Error al cargar actividades:", error);
    } finally {
      setLoadingActividades(false);
    }
  };

  useEffect(() => {
    const loadEsp = async () => {
      try {
        const data = await getEspacios();
        setEspacios(data);
      } catch (e) {
        console.error("Error cargando espacios:", e);
      }
    };
    loadEsp();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatSimpleDate = (dateString: string) => {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </View>
    );
  }

  if (!evento) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar el evento</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.eventTitle}>{evento.nombre}</Text>

          <View style={styles.dateSection}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateLabel}>Fecha de inicio</Text>
                <Text style={styles.dateValue}>
                  {formatDate(evento.fecha_inicio)}
                </Text>
              </View>
            </View>

            <View style={styles.dateItem}>
              <Ionicons name="calendar" size={20} color="#10B981" />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateLabel}>Fecha de finalización</Text>
                <Text style={styles.dateValue}>
                  {formatDate(evento.fecha_fin)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>
              {evento.descripcion || "Sin descripción disponible"}
            </Text>
          </View>

          {evento.nombre_espacio && (
            <View style={styles.locationSection}>
              <Ionicons name="location" size={20} color="#3B82F6" />
              <Text style={styles.locationText}>{evento.nombre_espacio}</Text>
            </View>
          )}
        </View>

        {/* Sección de Actividades */}
        <View style={styles.actividadesSection}>
          <Text style={styles.actividadesSectionTitle}>Actividades</Text>

          {loadingActividades ? (
            <View style={styles.actividadesLoading}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          ) : actividades.length > 0 ? (
            actividades.map((actividad) => (
              <Pressable
                key={actividad.id}
                style={styles.actividadCard}
                onPress={() => {
                  // Navega al mapa y enfoca el espacio
                  const espacioId =
                    typeof actividad.id_espacio === "number"
                      ? actividad.id_espacio
                      : espacios.find(e => e.nombre === actividad.espacio_nombre)?.id;

                  if (typeof espacioId === "number") {
                    // Navegar al contenedor de tabs; Expo Router enviará params al hijo index
                    router.push({ pathname: "/(tabs)", params: { spaceId: String(espacioId), spaceName: actividad.espacio_nombre } });
                  } else {
                    console.warn("No se pudo resolver el id del espacio para la actividad", actividad);
                  }
                }}
              >
                <Text style={styles.actividadNombre}>{actividad.nombre}</Text>
                <Text style={styles.actividadDescripcion}>
                  {actividad.descripcion}
                </Text>
                <View style={styles.actividadInfo}>
                  <View style={styles.actividadInfoItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.actividadInfoText}>
                      {formatSimpleDate(actividad.fecha)}
                    </Text>
                  </View>
                  <View style={styles.actividadInfoItem}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.actividadInfoText}>
                      {actividad.hora_inicio} - {actividad.hora_fin}
                    </Text>
                  </View>
                  <View style={styles.actividadInfoItem}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.actividadInfoText}>
                      {actividad.espacio_nombre || espacios.find(e => e.id === actividad.id_espacio)?.nombre || "Espacio"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.noActividadesText}>
              No hay actividades programadas para este evento
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 24,
  },
  dateSection: {
    marginBottom: 24,
    gap: 16,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 24,
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  locationText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "500",
  },
  actividadesSection: {
    marginTop: 16,
  },
  actividadesSectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  actividadesLoading: {
    padding: 20,
    alignItems: "center",
  },
  actividadCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actividadNombre: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  actividadDescripcion: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 12,
    lineHeight: 20,
  },
  actividadInfo: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  actividadInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actividadInfoText: {
    fontSize: 13,
    color: "#6B7280",
  },
  noActividadesText: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    padding: 20,
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
