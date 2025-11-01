import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT * 0.75; // 75% de la pantalla

// Permitimos cualquier id de región como string para soportar todos los elementos del SVG
type RegionId = string;

interface SpaceInfo {
  nombre: string;
  desc?: string;
  foto?: any;
  categorias?: string[];
}

// Información por defecto para algunas regiones; se puede ampliar.
const REGION_INFO: Record<string, SpaceInfo> = {
  hall: { 
    nombre: "Hall Principal", 
    desc: "Espacio amplio y luminoso que conecta los pabellones principales. Se usa para exposiciones, desfiles y eventos de diseño.",
    categorias: ["Estructura"]
  },
  pasillo: { 
    nombre: "Pasillo de Acceso", 
    desc: "Corredor principal de entrada al edificio.",
    categorias: ["Estructura"]
  },
  pecera: { 
    nombre: "Pecera", 
    desc: "Aula con paredes de vidrio para reuniones y clases especiales.",
    categorias: ["Aula", "Estructura"]
  },
  alumnos: { 
    nombre: "Área de Alumnos", 
    desc: "Espacio dedicado para estudiantes y actividades estudiantiles.",
    categorias: ["Afuera"]
  },
  buffet: { 
    nombre: "Buffet", 
    desc: "Cafetería y área de comidas del campus.",
    categorias: ["Afuera"]
  },
  sum: { 
    nombre: "Salón de Usos Múltiples (SUM)", 
    desc: "Auditorio para eventos, conferencias y actividades masivas.",
    categorias: ["Aula"]
  },
  baños_mixtos: { 
    nombre: "Baños Mixtos", 
    desc: "Servicios sanitarios de uso general.",
    categorias: ["Estructura"]
  },
  rectangle_28: { 
    nombre: "Área Auxiliar", 
    desc: "Espacio de uso administrativo.",
    categorias: ["Estructura"]
  },
  rectangle_35: { 
    nombre: "Oficina", 
    desc: "Espacio de oficina administrativa.",
    categorias: ["Estructura"]
  },
  rectangle_37: { 
    nombre: "Corredor", 
    desc: "Pasillo de conexión entre áreas.",
    categorias: ["Estructura"]
  },
  rectangle_39: { 
    nombre: "Área de Servicios", 
    desc: "Zona destinada a servicios generales.",
    categorias: ["Estructura"]
  },
  rectangle_40: { 
    nombre: "Pasillo Lateral", 
    desc: "Corredor lateral de acceso.",
    categorias: ["Estructura"]
  },
  rectangle_41: { 
    nombre: "Pasillo Lateral", 
    desc: "Corredor lateral de acceso.",
    categorias: ["Estructura"]
  },
  rectangle_8: { 
    nombre: "Depósito", 
    desc: "Área de almacenamiento.",
    categorias: ["Estructura"]
  },
  pasillo_2: { 
    nombre: "Pasillo Principal", 
    desc: "Corredor principal de circulación.",
    categorias: ["Estructura"]
  },
  pasillo_3: { 
    nombre: "Pasillo de Conexión", 
    desc: "Corredor que conecta diferentes sectores.",
    categorias: ["Estructura"]
  },
  // Peceras auxiliares
  pecera_2: { nombre: "Pecera 2", desc: "Módulo auxiliar destinado a pequeñas reuniones y trabajos prácticos.", categorias: ["Aula"] },
  pecera_3: { nombre: "Pecera 3", desc: "Módulo auxiliar destinado a tareas académicas.", categorias: ["Aula"] },
  pecera_4: { nombre: "Pecera 4", desc: "Espacio de trabajo pequeño.", categorias: ["Aula"] },
  pecera_5: { nombre: "Pecera 5", desc: "Módulo de apoyo docente.", categorias: ["Aula"] },
  pecera_6: { nombre: "Pecera 6", desc: "Módulo de apoyo docente.", categorias: ["Aula"] },
  pecera_7: { nombre: "Pecera 7", desc: "Área polivalente para actividades cortas.", categorias: ["Aula"] },
  pecera_8: { nombre: "Pecera 8", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_9: { nombre: "Pecera 9", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_10: { nombre: "Pecera 10", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_11: { nombre: "Pecera 11", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_12: { nombre: "Pecera 12", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_13: { nombre: "Pecera 13", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_14: { nombre: "Pecera 14", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_15: { nombre: "Pecera 15", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_16: { nombre: "Pecera 16", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_17: { nombre: "Pecera 17", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_18: { nombre: "Pecera 18", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },
  pecera_19: { nombre: "Pecera 19", desc: "Pequeño módulo auxiliar.", categorias: ["Aula"] },

  // Rectangles derechos/superiores
  rectangle_149: { nombre: "Sala 149", desc: "Sala multiuso ubicada en el sector derecho del plano.", categorias: ["Estructura"] },
  rectangle_150: { nombre: "Sala 150", desc: "Sala multiuso.", categorias: ["Estructura"] },
  rectangle_151: { nombre: "Sala 151", desc: "Sala auxiliar pequeña.", categorias: ["Estructura"] },
  rectangle_152: { nombre: "Sala 152", desc: "Sala auxiliar.", categorias: ["Estructura"] },
  rectangle_153: { nombre: "Sala 153", desc: "Sala auxiliar.", categorias: ["Estructura"] },
  rectangle_154: { nombre: "Sala 154", desc: "Sala auxiliar.", categorias: ["Estructura"] },
  rectangle_155: { nombre: "Sala 155", desc: "Sala auxiliar.", categorias: ["Estructura"] },
  rectangle_156: { nombre: "Sala 156", desc: "Sala auxiliar.", categorias: ["Estructura"] },
  rectangle_157: { nombre: "Sala 157", desc: "Sala auxiliar.", categorias: ["Estructura"] },
  rectangle_158: { nombre: "Sala 158", desc: "Sala auxiliar.", categorias: ["Estructura"] },
  anfiteatro_fisica: { nombre: "Anfiteatro Física", desc: "Anfiteatro", categorias: ["Estructura"] },

  // Pequeños módulos alrededor del buffet
  rectangle_53: { nombre: "Módulo 53", desc: "Espacio de servicio o instalación auxiliar.", categorias: ["Estructura"] },
  rectangle_56: { nombre: "Módulo 56", desc: "Espacio de servicio o instalación auxiliar.", categorias: ["Estructura"] },
  rectangle_58: { nombre: "Módulo 58", desc: "Instalación lateral auxiliar.", categorias: ["Estructura"] },
};

interface SpaceBottomSheetProps {
  selectedSpace: string | null;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Estructura": "#FB8C00",
  "Aula": "#E91E63",
  "Afuera": "#9C27B0",
};

export default function SpaceBottomSheet({ selectedSpace, onClose }: SpaceBottomSheetProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedSpace) {
      // Animar hacia arriba al 75% cuando se selecciona un espacio
      Animated.spring(translateY, {
        toValue: MAX_TRANSLATE_Y,
        useNativeDriver: true,
      }).start();
    } else {
      // Animar hacia abajo para cerrar
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedSpace, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderMove: (event, gestureState) => {
        const { dy } = gestureState;
        // Limitar el movimiento: no puede subir más del 75%
        const newTranslateY = Math.min(0, Math.max(MAX_TRANSLATE_Y + dy, MAX_TRANSLATE_Y));
        translateY.setValue(newTranslateY);
      },
      
      onPanResponderRelease: (event, gestureState) => {
        const { dy, vy } = gestureState;
        // Decidir si cerrar o mantener abierto basado en la velocidad y posición
        if (vy > 0.5 || dy > 100) {
          // Cerrar
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // Volver al 75%
          Animated.spring(translateY, {
            toValue: MAX_TRANSLATE_Y,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!selectedSpace) return null;

  // Soporte para cualquier id: si no hay info, mostramos un fallback
  const spaceInfo: SpaceInfo = REGION_INFO[selectedSpace] ?? {
    nombre: selectedSpace,
    desc: "Información no disponible para este espacio.",
  };

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
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Imagen placeholder */}
            <View style={styles.imageContainer}>
              {spaceInfo.foto ? (
                <Image source={spaceInfo.foto} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderText}>Imagen no disponible</Text>
                </View>
              )}
            </View>

            {/* Título */}
            <Text style={styles.title}>{spaceInfo.nombre}</Text>

            {/* Descripción */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción:</Text>
              <Text style={styles.description}>{spaceInfo.desc}</Text>
            </View>

            {/* Categorías */}
            {spaceInfo.categorias && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categorías:</Text>
                <View style={styles.categoriesContainer}>
                  {spaceInfo.categorias.map((categoria, index) => (
                    <View
                      key={index}
                      style={[
                        styles.categoryTag,
                        { backgroundColor: CATEGORY_COLORS[categoria] || "#757575" }
                      ]}
                    >
                      <Text style={styles.categoryText}>{categoria}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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