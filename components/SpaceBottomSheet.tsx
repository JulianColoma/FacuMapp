import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Espacio } from "../services/api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT * 0.90; // 90% de la pantalla

// Permitimos cualquier id de región como string para soportar todos los elementos del SVG
type RegionId = string;

interface SpaceInfo {
  nombre: string;
  desc?: string;
  foto?: any;
  categorias?: string[];
}

interface SpaceBottomSheetProps {
  selectedSpace: Espacio | null;  // ← Espacio completo
  onClose: () => void;
  onWillClose?: () => void; // se dispara apenas comienza el cierre
  selectionVersion?: number; // cambia en cada selección para forzar apertura
}

const CATEGORY_COLORS: Record<string, string> = {
  "Estructura": "#FB8C00",
  "Aula": "#E91E63",
  "Afuera": "#9C27B0",
};

export default function SpaceBottomSheet({ selectedSpace, onClose, onWillClose, selectionVersion }: SpaceBottomSheetProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Interrumpir cualquier animación anterior para evitar "tironeos" y delays
    translateY.stopAnimation(() => {
      if (selectedSpace) {
        Animated.spring(translateY, {
          toValue: MAX_TRANSLATE_Y,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [selectedSpace, translateY, selectionVersion]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderMove: (event, gestureState) => {
        const { dy } = gestureState;
        // Limitar el movimiento: no puede subir más del 90%
        const newTranslateY = Math.min(0, Math.max(MAX_TRANSLATE_Y + dy, MAX_TRANSLATE_Y));
        translateY.setValue(newTranslateY);
      },
      
      onPanResponderRelease: (event, gestureState) => {
        const { dy, vy } = gestureState;
        // Decidir si cerrar o mantener abierto basado en la velocidad y posición
        if (vy > 0.5 || dy > 100) {
          // Cerrar
          // Avisar inmediatamente para que el highlight se quite sin delay
          onWillClose?.();
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) onClose();
          });
        } else {
          // Volver al 90%
          Animated.spring(translateY, {
            toValue: MAX_TRANSLATE_Y,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const API_URL = 'http://192.168.0.168:3000';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content} {...panResponder.panHandlers}>
          {/* Indicador de arrastre */}
          <View style={styles.dragIndicator} />

          {selectedSpace && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Imagen placeholder */}
              <View style={styles.imageContainer}>
                {selectedSpace.imagen ? (
                  <Image
                    source={{ uri: `${API_URL}/uploads/${selectedSpace.imagen}` }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>Imagen no disponible</Text>
                  </View>
                )}
              </View>

              {/* Título */}
              <Text style={styles.title}>{selectedSpace.nombre}</Text>

              {/* Descripción */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Descripción:</Text>
                <Text style={styles.description}>{selectedSpace.descripcion}</Text>
              </View>

              {/* Categorías */}
              {selectedSpace.categorias && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Categorías:</Text>
                  <View style={styles.categoriesContainer}>
                    {selectedSpace.categorias.map((categoria, index) => (
                      <View
                        key={index}
                        style={[
                          styles.categoryTag,
                          { backgroundColor: CATEGORY_COLORS[categoria] || "#757575" },
                        ]}
                      >
                        <Text style={styles.categoryText}>{categoria}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  imageContainer: {
    width: "95%",
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    alignSelf: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});