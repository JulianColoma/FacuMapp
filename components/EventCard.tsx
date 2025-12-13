import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface EventCardProps {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  espacio?: string;
  color: string;
  onPress?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
  nombre,
  fechaInicio,
  fechaFin,
  espacio,
  color,
  onPress,
}) => {
  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: hexToRgba(color, 0.12) }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: hexToRgba(color, 0.08),
          borderLeftColor: color,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={styles.title}>{nombre}</Text>
      <Text style={styles.date}>
        {fechaInicio} - {fechaFin}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
  },
  date: {
    paddingVertical: 2,
    fontSize: 14,
    color: "#4B5563",
  },
});

export default EventCard;