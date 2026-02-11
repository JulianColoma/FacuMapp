import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { COLORS } from "../constants/colors";
import { ZONES } from "../data/zones";
import { Espacio, getCategorias, getEspacios } from "../services/api";
import Filters from "./Filters";
import Searchbar from "./Searchbar";
import SpaceBottomSheet from "./SpaceBottomSheet";

// Parsear path SVG simple (M, L, H, V, Z) a array de puntos
function parseSVGPath(pathData: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const commands = pathData.match(/[MLHVZ][^MLHVZ]*/g) || [];

  let currentX = 0;
  let currentY = 0;

  commands.forEach((cmd) => {
    const type = cmd[0];
    const coords = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => !isNaN(n));

    if (type === "M") {
      // Move to absolute coordinates
      if (coords.length >= 2) {
        currentX = coords[0];
        currentY = coords[1];
        points.push({ x: currentX, y: currentY });
      }
    } else if (type === "L") {
      // Line to absolute coordinates
      if (coords.length >= 2) {
        currentX = coords[0];
        currentY = coords[1];
        points.push({ x: currentX, y: currentY });
      }
    } else if (type === "H") {
      // Horizontal line to (solo cambia X)
      if (coords.length >= 1) {
        currentX = coords[0];
        points.push({ x: currentX, y: currentY });
      }
    } else if (type === "V") {
      // Vertical line to (solo cambia Y)
      if (coords.length >= 1) {
        currentY = coords[0];
        points.push({ x: currentX, y: currentY });
      }
    }
    // Z (close path) no añade puntos, solo indica que se cierre
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
const calculateMapDimensions = (() => {
  let cached: { width: number; height: number; scale: number } | null = null;

  return () => {
    if (cached) return cached;

    if (ZONES.length === 0) {
      cached = { width: 300, height: 200, scale: 1 };
      return cached;
    }

    let maxX = 0;
    let maxY = 0;

    ZONES.forEach((zone) => {
      if (
        zone.x !== undefined &&
        zone.y !== undefined &&
        zone.w !== undefined &&
        zone.h !== undefined
      ) {
        maxX = Math.max(maxX, zone.x + zone.w);
        maxY = Math.max(maxY, zone.y + zone.h);
      }
      if (zone.boundingBox) {
        maxX = Math.max(maxX, zone.boundingBox.x + zone.boundingBox.width);
        maxY = Math.max(maxY, zone.boundingBox.y + zone.boundingBox.height);
      }
    });

    if (maxX === 0 || maxY === 0) {
      cached = { width: 300, height: 200, scale: 1 };
      return cached;
    }

    // Limitar el tamaño máximo del SVG a 1200px (límite de React Native SVG)
    const MAX_SVG_WIDTH = 1200;
    let scale = 1;

    if (maxX > MAX_SVG_WIDTH) {
      scale = MAX_SVG_WIDTH / maxX;
    }

    cached = {
      width: Math.ceil(maxX * scale),
      height: Math.ceil(maxY * scale),
      scale: scale,
    };

    console.log("Map dimensions:", cached, "Original:", maxX, maxY);
    return cached;
  };
})();

const mapDims = calculateMapDimensions();
const { width: MAP_W, height: MAP_H, scale: MAP_SCALE } = mapDims;

// Calcular las dimensiones originales sin escala
const ORIGINAL_MAP_WIDTH = Math.ceil(
  Math.max(
    ...ZONES.map((z) => {
      if (z.x !== undefined && z.w !== undefined) return z.x + z.w;
      if (z.boundingBox) return z.boundingBox.x + z.boundingBox.width;
      return 0;
    }),
    300,
  ),
);

const ORIGINAL_MAP_HEIGHT = Math.ceil(
  Math.max(
    ...ZONES.map((z) => {
      if (z.y !== undefined && z.h !== undefined) return z.y + z.h;
      if (z.boundingBox) return z.boundingBox.y + z.boundingBox.height;
      return 0;
    }),
    200,
  ),
);

const { width: SCREEN_W } = Dimensions.get("window");

const minScale = 0.5;
const maxScale = 3;

// Componentes memorizados para máxima performance
const RectPressable = memo(({ zone, highlightType, customColor, onPress }: any) => {
  const getHighlightStyle = () => {
    if (highlightType === 'selected') {
      return {
        backgroundColor: "rgba(56, 220, 38, 0.3)",
        borderColor: COLORS.verde,
      };
    } else if (highlightType === 'category') {
      return {
        bg: customColor + "4D", // Color dinámico con transparencia
        border: customColor     // Color dinámico sólido
      };
    } else {
      return {
        backgroundColor: "rgba(33, 150, 243, 0.15)",
        borderColor: "rgba(33, 150, 243, 0.3)",
      };
    }
  };

  const style = getHighlightStyle();

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        left: zone.x,
        top: zone.y,
        width: zone.w,
        height: zone.h,
        backgroundColor: style.backgroundColor,
        borderWidth: 1,
        borderColor: style.borderColor,
        opacity: 0.7,
      }}
    />
  );
});

const PathPressable = memo(
  ({ zone, boundingBox, polygonPoints, onPress }: any) => (
    <Pressable
      onPress={(event) => {
        const { locationX, locationY } = event.nativeEvent;
        // locationX/Y ya son relativos al Pressable (que está en boundingBox)
        // Y polygonPoints ya están escalados
        const isInside = isPointInPolygon(
          { x: locationX, y: locationY },
          polygonPoints,
        );
        if (isInside) onPress(zone.id);
      }}
      style={{
        position: "absolute",
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
        backgroundColor: "transparent",
      }}
    />
  ),
);

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
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sheetBlocking, setSheetBlocking] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);

  // Memoizar separación de zonas y parsing de TODOs los paths UNA SOLA VEZ
  const {
    nonPressables,
    pressableRects,
    pressablePaths,
    parsedPolygonsMap,
    scaledZonesMap,
    nonPressablesOriginal,
  } = useMemo(() => {
    const nonPressables: typeof ZONES = [];
    const nonPressablesOriginal: typeof ZONES = [];
    const pressableRects: typeof ZONES = [];
    const pressablePaths: typeof ZONES = [];
    const polygonsMap = new Map<string, Array<{ x: number; y: number }>>();
    const zonesMap = new Map<string, any>();

    ZONES.forEach((zone) => {
      // Escalar zona si es necesario
      const scaledZone = { ...zone };

      if (MAP_SCALE !== 1) {
        if (scaledZone.x !== undefined) scaledZone.x *= MAP_SCALE;
        if (scaledZone.y !== undefined) scaledZone.y *= MAP_SCALE;
        if (scaledZone.w !== undefined) scaledZone.w *= MAP_SCALE;
        if (scaledZone.h !== undefined) scaledZone.h *= MAP_SCALE;

        if (scaledZone.boundingBox) {
          scaledZone.boundingBox = {
            x: scaledZone.boundingBox.x * MAP_SCALE,
            y: scaledZone.boundingBox.y * MAP_SCALE,
            width: scaledZone.boundingBox.width * MAP_SCALE,
            height: scaledZone.boundingBox.height * MAP_SCALE,
          };
        }

        // Escalar path si existe
        if (scaledZone.path) {
          // Para los paths, no escalamos el string, pero guardamos el factor de escala
          // Los puntos parseados se escalarán en el cálculo de isPointInPolygon
        }
      }

      zonesMap.set(scaledZone.id, scaledZone);

      if (!scaledZone.pressable) {
        nonPressables.push(scaledZone);
        nonPressablesOriginal.push(zone);
      } else if (scaledZone.path) {
        pressablePaths.push(scaledZone);
        // PARSEAR AQUI UNA SOLA VEZ - luego escalar y trasladar los puntos si necesario
        let points = parseSVGPath(scaledZone.path);

        // Copiar los puntos para no mutar el original
        points = points.map((p) => ({ x: p.x, y: p.y }));

        if (MAP_SCALE !== 1) {
          // Escalar todos los puntos del polígono
          points.forEach((p) => {
            p.x *= MAP_SCALE;
            p.y *= MAP_SCALE;
          });
        }

        // Trasladar los puntos para que sean relativos al boundingBox
        if (scaledZone.boundingBox) {
          const offsetX = scaledZone.boundingBox.x;
          const offsetY = scaledZone.boundingBox.y;
          points.forEach((p) => {
            p.x -= offsetX;
            p.y -= offsetY;
          });
        }

        polygonsMap.set(scaledZone.id, points);
      } else if (scaledZone.x !== undefined && scaledZone.y !== undefined) {
        pressableRects.push(scaledZone);
      }
    });

    return {
      nonPressables,
      pressableRects,
      pressablePaths,
      parsedPolygonsMap: polygonsMap,
      scaledZonesMap: zonesMap,
      nonPressablesOriginal,
    };
  }, [MAP_SCALE]);

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

  const openSpace = useCallback(
    (zoneId: string) => {
      setSelected(zoneId);
      setHighlighted(zoneId);
      setSheetBlocking(true);
      setSelectionVersion((v) => v + 1);

      // Obtener la zona desde el mapa de zonas escaladas
      const zona = scaledZonesMap.get(zoneId);
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
    },
    [offsetX, offsetY, scale, scaledZonesMap],
  );

  const closeSheet = useCallback(() => {
    setSelected(null);
    setSheetBlocking(false);
  }, []);

  const handleSheetWillClose = useCallback(() => {
    setHighlighted(null);
    setSheetBlocking(false);
  }, []);

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
  if (!selectedCategory) return []; // Si es null, no resaltamos nada

  return espacios
    .filter((espacio) => {
      if (!espacio.categorias || !Array.isArray(espacio.categorias)) return false;
      
      return espacio.categorias.some((cat: any) => {
        const catId = cat.id?.toString() || cat.nombre?.toLowerCase().replace(/\s+/g, "_");
        // COMPARACIÓN: catId contra el ID del objeto seleccionado
        return catId === selectedCategory.id; 
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
    const categoriasFormateadas = data.map((cat: any) => ({
      id: cat.id?.toString() || cat.nombre?.toLowerCase().replace(/\s+/g, "_"),
      label: cat.nombre || cat.label || "",
      color: cat.color || "#FACC15", 
    }));
    setCategorias(categoriasFormateadas);
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
      if (scaledZonesMap.has(initialSpaceId)) {
        openSpace(initialSpaceId);
        return true;
      }
      const numId = Number(initialSpaceId);
      if (!Number.isNaN(numId)) {
        const numIdStr = String(numId);
        if (scaledZonesMap.has(numIdStr)) {
          openSpace(numIdStr);
          return true;
        }
      }
      return false;
    };

    const tryOpenByName = () => {
      if (!initialSpaceName) return false;
      const espacio = espacios.find((e) => e.nombre === initialSpaceName);
      if (espacio) {
        const espIdStr = String(espacio.id);
        if (scaledZonesMap.has(espIdStr)) {
          openSpace(espIdStr);
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
  }, [initialSpaceId, initialSpaceName, espacios, scaledZonesMap]);

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
        <View
          style={{
            position: "relative",
            width: MAP_W,
            height: MAP_H,
          }}
        >
          {/* Primero: Zonas no presionables */}
          <Svg
            width={MAP_W}
            height={MAP_H}
            viewBox={`0 0 ${ORIGINAL_MAP_WIDTH} ${ORIGINAL_MAP_HEIGHT}`}
            style={{ position: "absolute" }}
          >
            {/* Renderizar paths no-presionables desde zones.ts */}
            {nonPressablesOriginal.map((zone) => {
              if (zone.path) {
                // Zona irregular con path
                return (
                  <Path
                    key={zone.id}
                    d={zone.path}
                    fill={zone.fill || "grey"}
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
                    fill={zone.fill || "grey"}
                  />
                );
              }
            })}

            {/* Zonas presionables con path (sin interactividad aun) */}
            {pressablePaths.map((zone) => {
              const isSelected = selected === zone.id || highlighted === zone.id;
              const isCategory = highlightedByCategory.includes(zone.id);
              
              let fill = zone.fill || "rgba(33, 150, 243, 0.15)";
              let stroke = "rgba(33, 150, 243, 0.3)";
              
              if (isSelected) {
                fill = "rgba(56, 220, 38, 0.3)";
                stroke = COLORS.verde;
              } else if (isCategory && selectedCategory) {
                  fill = selectedCategory.color + "4D"; 
                  stroke = selectedCategory.color;
              } 
              
              return (
                <Path
                  key={zone.id}
                  d={zone.path!}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1}
                />
              );
            })}
          </Svg>

          {/* Pressables invisibles sobre zonas con path para funcionar en celular */}
          {pressablePaths
            .filter((zone) => zone.boundingBox)
            .map((zone) => (
              <PathPressable
                key={`pressable-${zone.id}`}
                zone={zone}
                boundingBox={zone.boundingBox}
                polygonPoints={parsedPolygonsMap.get(zone.id)}
                onPress={openSpace}
              />
            ))}

          {/* Zonas presionables rectangulares (Pressables) */}
          {pressableRects.map((zone) => {
            const isSelected = highlighted === zone.id;
            const isCategory = highlightedByCategory.includes(zone.id);
            
            let highlightType = 'none';
            if (isSelected) {
              highlightType = 'selected';
            } else if (isCategory) {
              highlightType = 'category';
            }
            
            return (
              <RectPressable
                key={zone.id}
                zone={zone}
                highlightType={highlightType}
                customColor={selectedCategory?.color}
                onPress={() => openSpace(zone.id)}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* Searchbar + Filters flotantes */}
      <View style={styles.searchbarContainer} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <Searchbar
              onSearchChange={handleSearchChange}
              value={searchQuery}
            />
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
