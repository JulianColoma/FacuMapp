import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  Keyboard,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { COLORS, SPACE_COLORS } from "../constants/colors";
import { Espacio, getCategorias, getEspacios } from "../services/api";
import Filters from "./Filters";
import Searchbar from "./Searchbar";
import SpaceBottomSheet from "./SpaceBottomSheet";
import { ZONES } from "../data/zones";

// Parsear path SVG simple (M, L, Z) a array de puntos
function parseSVGPath(pathData: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const commands = pathData.match(/[MLZ][^MLZ]*/g) || [];

  commands.forEach((cmd) => {
    const type = cmd[0];
    const coords = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    if (type === "M" || type === "L") {
      for (let i = 0; i < coords.length; i += 2) {
        if (!isNaN(coords[i]) && !isNaN(coords[i + 1])) {
          points.push({ x: coords[i], y: coords[i + 1] });
        }
      }
    }
  });

  return points;
}

// Algoritmo Ray Casting: verificar si un punto está dentro de un polígono
function isPointInPolygon(
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>,
): boolean {
  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

// Calcular dimensiones del mapa dinámicamente basándose en las zonas
const calculateMapDimensions = () => {
  if (ZONES.length === 0) {
    return { width: 300, height: 200 }; // fallback si no hay zonas
  }

  let maxX = 0;
  let maxY = 0;

  ZONES.forEach((zone) => {
    // Zonas rectangulares
    if (
      zone.x !== undefined &&
      zone.y !== undefined &&
      zone.w !== undefined &&
      zone.h !== undefined
    ) {
      maxX = Math.max(maxX, zone.x + zone.w);
      maxY = Math.max(maxY, zone.y + zone.h);
    }
    // Zonas con boundingBox definido
    if (zone.boundingBox) {
      maxX = Math.max(maxX, zone.boundingBox.x + zone.boundingBox.width);
      maxY = Math.max(maxY, zone.boundingBox.y + zone.boundingBox.height);
    }
  });

  // Si no se encontró ninguna dimensión, usar fallback
  if (maxX === 0 || maxY === 0) {
    return { width: 300, height: 200 };
  }

  return {
    width: maxX,
    height: maxY,
  };
};

const { width: MAP_W, height: MAP_H } = calculateMapDimensions();
console.log("MAP_W:", MAP_W, "MAP_H:", MAP_H);
const { width: SCREEN_W } = Dimensions.get("window");

const minScale = 0.5;
const maxScale = 3;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function InteractiveMap({
  initialSpaceId,
  initialSpaceName,
}: {
  initialSpaceId?: string;
  initialSpaceName?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; label: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sheetBlocking, setSheetBlocking] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);

  // Separar zonas por tipo: primero no presionables, luego presionables
  const nonPressableZones = ZONES.filter((zone) => !zone.pressable);
  const pressableZones = ZONES.filter((zone) => zone.pressable);

  const offsetX = useRef(new Animated.Value(0)).current;
  const offsetY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastOffsetX = useRef(0);
  const lastOffsetY = useRef(0);
  const lastScale = useRef(1);

  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef(1);

  const computeBounds = (currentScale: number) => {
    return {
      minX: -SCREEN_W / 2 - (MAP_W * currentScale) / 2 + 50 * currentScale,
      maxX: SCREEN_W / 2 + (MAP_W * currentScale) / 2 - 50 * currentScale,
      minY:
        -containerHeight / 2 - (MAP_H * currentScale) / 2 + 50 * currentScale,
      maxY:
        containerHeight / 2 + (MAP_H * currentScale) / 2 - 50 * currentScale,
    };
  };

  let { minX, maxX, minY, maxY } = computeBounds(lastScale.current);

  const updateBounds = (currentScale: number) => {
    const bounds = computeBounds(currentScale);
    minX = bounds.minX;
    maxX = bounds.maxX;
    minY = bounds.minY;
    maxY = bounds.maxY;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: (evt) => {
          const touches = (evt.nativeEvent as any).touches || [];
          return touches.length >= 2;
        },
        onMoveShouldSetPanResponder: (_evt, g) =>
          g.numberActiveTouches < 2 &&
          (Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10),
        onMoveShouldSetPanResponderCapture: (evt) => {
          const touches = (evt.nativeEvent as any).touches || [];
          return touches.length >= 2;
        },
        onPanResponderGrant: (evt) => {
          const touches = (evt.nativeEvent as any).touches || [];
          if (touches.length >= 2) {
            const [a, b] = touches;
            const dx = a.pageX - b.pageX;
            const dy = a.pageY - b.pageY;
            pinchStartDistance.current = Math.hypot(dx, dy);
            pinchStartScale.current = lastScale.current;
          } else {
            pinchStartDistance.current = null;
          }
        },
        onPanResponderMove: (evt, { dx, dy }) => {
          const touches = (evt.nativeEvent as any).touches || [];
          if (touches.length >= 2) {
            const [a, b] = touches;
            const dx = a.pageX - b.pageX;
            const dy = a.pageY - b.pageY;
            const distance = Math.hypot(dx, dy);
            const start = pinchStartDistance.current || distance;
            const nextScale = pinchStartScale.current * (distance / start);
            const clampedScale = clamp(nextScale, minScale, maxScale);

            // Calcular el punto focal en el centro de la pantalla
            const focalX = -lastOffsetX.current / pinchStartScale.current;
            const focalY = -lastOffsetY.current / pinchStartScale.current;

            // Ajustar la traslación para mantener el punto focal fijo
            const newOffsetX = -focalX * clampedScale;
            const newOffsetY = -focalY * clampedScale;

            scale.setValue(clampedScale);
            offsetX.setValue(newOffsetX);
            offsetY.setValue(newOffsetY);
          } else {
            const newX = clamp(lastOffsetX.current + dx, minX, maxX);
            const newY = clamp(lastOffsetY.current + dy, minY, maxY);

            offsetX.setValue(newX);
            offsetY.setValue(newY);
          }
        },
        onPanResponderRelease: (_evt, { dx, dy }) => {
          const touches = (_evt.nativeEvent as any).touches || [];
          if (touches.length < 2) {
            lastOffsetX.current = clamp(lastOffsetX.current + dx, minX, maxX);
            lastOffsetY.current = clamp(lastOffsetY.current + dy, minY, maxY);
          }
          scale.stopAnimation((s) => {
            lastScale.current = clamp(s, minScale, maxScale);
            updateBounds(lastScale.current);
          });
          offsetX.stopAnimation((x) => {
            lastOffsetX.current = x;
          });
          offsetY.stopAnimation((y) => {
            lastOffsetY.current = y;
          });
        },
      }),
    [minX, maxX, minY, maxY],
  );

  const openSpace = (zoneId: string) => {
    setSelected(zoneId);
    setHighlighted(zoneId);
    setSheetBlocking(true);
    setSelectionVersion((v) => v + 1);

    const zona = ZONES.find((z) => z.id === zoneId);
    if (!zona) return;

    let targetX: number;
    let targetY: number;

    // Calcular centro según el tipo de zona
    if (
      zona.x !== undefined &&
      zona.y !== undefined &&
      zona.w !== undefined &&
      zona.h !== undefined
    ) {
      // Zona rectangular
      targetX = MAP_W / 2 - zona.x - zona.w / 2;
      targetY = MAP_H / 3 - zona.y - zona.h / 2;
    } else if (zona.boundingBox) {
      // Zona con path - usar boundingBox para centrado
      targetX = MAP_W / 2 - zona.boundingBox.x - zona.boundingBox.width / 2;
      targetY = MAP_H / 3 - zona.boundingBox.y - zona.boundingBox.height / 2;
    } else {
      // No se puede centrar, salir
      return;
    }

    Animated.parallel([
      Animated.timing(offsetX, {
        toValue: targetX,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(offsetY, {
        toValue: targetY,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    lastOffsetX.current = targetX;
    lastOffsetY.current = targetY;
    lastScale.current = 1;
    updateBounds(lastScale.current);
  };

  const closeSheet = () => {
    setSelected(null);
    setSheetBlocking(false);
  };
  const handleSheetWillClose = () => {
    setHighlighted(null);
    setSheetBlocking(false);
  };

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(text.trim().length > 0);
  };

  const suggestions = useMemo(() => {
    const q = normalize(searchQuery.trim());
    if (!q) return [] as Espacio[];
    const byMatch = espacios.filter((e) =>
      normalize(e.nombre || "").includes(q),
    );
    // Priorizar comienza con "q"
    const starts = byMatch.filter((e) =>
      normalize(e.nombre || "").startsWith(q),
    );
    const rest = byMatch.filter(
      (e) => !normalize(e.nombre || "").startsWith(q),
    );
    return [...starts, ...rest].slice(0, 8);
  }, [espacios, searchQuery]);

  // Calcular espacios que coinciden con la categoría seleccionada
  const highlightedByCategory = useMemo(() => {
    if (!selectedCategory) return [];

    return espacios
      .filter((espacio) => {
        if (!espacio.categorias || !Array.isArray(espacio.categorias)) {
          return false;
        }
        // Buscar si alguna categoría del espacio coincide con la seleccionada
        return espacio.categorias.some((cat: any) => {
          const catId =
            cat.id?.toString() ||
            cat.nombre?.toLowerCase().replace(/\s+/g, "_");
          return catId === selectedCategory;
        });
      })
      .map((espacio) => espacio.id.toString());
  }, [espacios, selectedCategory]);

  const handleSelectSuggestion = (zoneId: string) => {
    setShowSuggestions(false);
    setSearchQuery("");
    Keyboard.dismiss();

    openSpace(zoneId);
  };

  // Cargar espacios del backend
  useEffect(() => {
    const loadEspacios = async () => {
      try {
        setLoading(true);
        const data = await getEspacios();
        setEspacios(data);
        console.log("✅ Espacios guardados en estado");
      } catch (error) {
        console.error("❌ Error cargando espacios:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEspacios();
  }, []);

  // Cargar categorías del backend
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const data = await getCategorias();
        // Transformar datos del backend al formato esperado por Filters
        const categoriasFormateadas = data.map((cat: any) => ({
          id:
            cat.id?.toString() ||
            cat.nombre?.toLowerCase().replace(/\s+/g, "_") ||
            "",
          label: cat.nombre || cat.label || "",
        }));
        setCategorias(categoriasFormateadas);
        console.log("✅ Categorías cargadas:", categoriasFormateadas);
      } catch (error) {
        console.error("❌ Error cargando categorías:", error);
      }
    };

    loadCategorias();
  }, []);

  // Abrir espacio inicial si viene por navegación (por id o por nombre)
  useEffect(() => {
    const tryOpenById = () => {
      if (!initialSpaceId) return false;
      const zoneDirect = ZONES.find((z) => z.id === initialSpaceId);
      if (zoneDirect) {
        openSpace(zoneDirect.id);
        return true;
      }
      const numId = Number(initialSpaceId);
      if (!Number.isNaN(numId)) {
        const zoneByNum = ZONES.find((z) => z.id === String(numId));
        if (zoneByNum) {
          openSpace(zoneByNum.id);
          return true;
        }
      }
      return false;
    };

    const tryOpenByName = () => {
      if (!initialSpaceName) return false;
      const espacio = espacios.find((e) => e.nombre === initialSpaceName);
      if (espacio) {
        const zoneByEspId = ZONES.find((z) => z.id === String(espacio.id));
        if (zoneByEspId) {
          openSpace(zoneByEspId.id);
          return true;
        }
      }
      return false;
    };

    // Intentar por id primero; si no, por nombre
    const okById = tryOpenById();
    if (okById) return;
    const okByName = tryOpenByName();
    if (okByName) return;

    if (initialSpaceId || initialSpaceName)
      console.warn("No se encontró zona para:", {
        initialSpaceId,
        initialSpaceName,
      });
  }, [initialSpaceId, initialSpaceName, espacios]);

  // Buscar espacio seleccionado with debug
  const espacioSeleccionado = useMemo(() => {
    if (!selected) return null;
    const espacio = espacios.find((e) => e.id.toString() === selected);
    return espacio || null;
  }, [selected, espacios]);

  const screenWidth = Math.round(Dimensions.get("window").width);
  const screenHeight = Math.round(Dimensions.get("window").height);

  return (
    <View
      style={styles.container}
      {...(sheetBlocking || showSuggestions ? {} : panResponder.panHandlers)}
      onLayout={(event) => {
        setContainerHeight(event.nativeEvent.layout.height);
      }}
    >
      {/* Indicador de carga */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando espacios...</Text>
        </View>
      )}

      <Animated.View
        style={{
          transform: [
            { translateX: offsetX },
            { translateY: offsetY },
            { scale: scale },
          ],
        }}
      >
        <View style={{ position: "relative", width: MAP_W, height: MAP_H }}>
          {/* Primero: Zonas no presionables */}
          <Svg
            width={MAP_W}
            height={MAP_H}
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            style={{ position: "absolute" }}
          >
            {/* Renderizar paths no-presionables desde zones.ts */}
            {nonPressableZones.map((zone) => {
              if (zone.path) {
                // Zona irregular con path
                return (
                  <Path
                    key={zone.id}
                    d={zone.path}
                    fill={zone.fill || "#f0f0f0"}
                    stroke={zone.stroke || "#333"}
                    strokeWidth={zone.strokeWidth || 2}
                  />
                );
              } else {
                // Zona rectangular
                return (
                  <Rect
                    key={zone.id}
                    x={zone.x}
                    y={zone.y}
                    width={zone.w}
                    height={zone.h}
                    fill={zone.fill || "#f0f0f0"}
                    stroke={zone.stroke || "#333"}
                    strokeWidth={zone.strokeWidth || 2}
                  />
                );
              }
            })}

            {/* Zonas presionables con path (sin interactividad aun) */}
            {pressableZones
              .filter((zone) => zone.path)
              .map((zone) => (
                <Path
                  key={zone.id}
                  d={zone.path!}
                  fill={
                    selected === zone.id ? "#FF6B6B" : zone.fill || "#6BCB77"
                  }
                  stroke={zone.stroke || "#333"}
                  strokeWidth={zone.strokeWidth || 2}
                  opacity={0.7}
                />
              ))}
          </Svg>

          {/* Pressables invisibles sobre zonas con path para funcionar en celular */}
          {pressableZones
            .filter((zone) => zone.path && zone.boundingBox)
            .map((zone) => {
              const polygonPoints = zone.path ? parseSVGPath(zone.path) : [];

              return (
                <Pressable
                  key={`pressable-${zone.id}`}
                  onPress={(event) => {
                    // Obtener coordenadas del toque relativas al Pressable
                    const { locationX, locationY } = event.nativeEvent;

                    // Ajustar coordenadas para que sean relativas al mapa completo
                    const absoluteX = locationX + zone.boundingBox!.x;
                    const absoluteY = locationY + zone.boundingBox!.y;

                    // Verificar si el toque está dentro del polígono real
                    const isInside = isPointInPolygon(
                      { x: absoluteX, y: absoluteY },
                      polygonPoints,
                    );

                    if (isInside) {
                      openSpace(zone.id);
                    }
                  }}
                  style={{
                    position: "absolute",
                    left: zone.boundingBox!.x,
                    top: zone.boundingBox!.y,
                    width: zone.boundingBox!.width,
                    height: zone.boundingBox!.height,
                    backgroundColor: "transparent",
                  }}
                />
              );
            })}

          {/* Zonas interactivas usando Pressables mapeados */}
          <View
            style={styles.overlay}
            pointerEvents={sheetBlocking ? "none" : "auto"}
          >
            {ZONES.filter((zone) => zone.pressable).map((zone) => {
              // Determinar posición y tamaño según tipo de zona
              const left = zone.x ?? zone.boundingBox?.x ?? 0;
              const top = zone.y ?? zone.boundingBox?.y ?? 0;
              const width = zone.w ?? zone.boundingBox?.width ?? 0;
              const height = zone.h ?? zone.boundingBox?.height ?? 0;

              return (
                <Pressable
                  key={zone.id}
                  onPress={() => openSpace(zone.id)}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width,
                    height,
                    backgroundColor:
                      highlighted === zone.id ||
                      highlightedByCategory.includes(zone.id)
                        ? "rgba(56, 220, 38, 0.3)"
                        : "rgba(33, 150, 243, 0.15)",
                    borderWidth: 1,
                    borderColor:
                      highlighted === zone.id ||
                      highlightedByCategory.includes(zone.id)
                        ? COLORS.verde
                        : "rgba(33, 150, 243, 0.3)",
                  }}
                />
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Searchbar + Filters flotantes */}
      <View style={styles.searchbarContainer} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <Searchbar onSearchChange={handleSearchChange} />
          </View>

          <Filters
            categories={categorias}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>
        {showSuggestions && (
          <View style={styles.suggestionsContainer} pointerEvents="auto">
            {suggestions.length === 0 ? (
              <View style={styles.suggestionItem}>
                <Text style={styles.suggestionText}>Sin resultados</Text>
              </View>
            ) : (
              suggestions.map((esp) => (
                <Pressable
                  key={esp.id}
                  onPress={() => handleSelectSuggestion(esp.id.toString())}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{esp.nombre}</Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </View>

      {/* Bottom Sheet con datos del backend */}
      <SpaceBottomSheet
        selectedSpace={espacioSeleccionado}
        onClose={closeSheet}
        onWillClose={handleSheetWillClose}
        selectionVersion={selectionVersion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blanco,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  // Capa de overlays alineada al SVG (mismas dimensiones base)
  overlay: {
    position: "absolute",
    left: 0,
    top: 0,
    width: MAP_W,
    height: MAP_H,
  },
  searchbarContainer: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    maxHeight: 260,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  suggestionText: {
    fontSize: 15,
    color: "#1F2937",
  },
  loadingContainer: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    padding: 15,
    borderRadius: 10,
    zIndex: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingText: {
    fontSize: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  searchWrapper: {
    flex: 1,
    marginRight: 0,
  },
});
