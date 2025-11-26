import React, { useMemo, useRef, useState } from "react";
import {
    Animated,
    GestureResponderEvent,
    PanResponder,
    PanResponderGestureState,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import Svg, { G, Rect } from "react-native-svg";
import SpaceBottomSheet from "./SpaceBottomSheet";

type RegionId = string;

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const PAN_THRESHOLD = 10;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function InteractiveMap() {
  const [selected, setSelected] = useState<RegionId | null>(null);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const lastTx = useRef(0);
  const lastTy = useRef(0);
  const lastScale = useRef(1);

  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef(1);

  const setScaleNow = (val: number) => {
    const clamped = clamp(val, MIN_SCALE, MAX_SCALE);
    scale.setValue(clamped);
  };
  const setTranslateNow = (x: number, y: number) => {
    translateX.setValue(x);
    translateY.setValue(y);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: (evt) => {
          const touches = (evt.nativeEvent as any).touches || [];
          return touches.length >= 2; // captura pinch
        },
        onMoveShouldSetPanResponder: (_evt, g) =>
          g.numberActiveTouches < 2 &&
          (Math.abs(g.dx) > PAN_THRESHOLD || Math.abs(g.dy) > PAN_THRESHOLD),
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
        onPanResponderMove: (evt: GestureResponderEvent, g: PanResponderGestureState) => {
          const touches = (evt.nativeEvent as any).touches || [];
          if (touches.length >= 2) {
            const [a, b] = touches;
            const dx = a.pageX - b.pageX;
            const dy = a.pageY - b.pageY;
            const dist = Math.hypot(dx, dy);
            const start = pinchStartDistance.current || dist;
            const nextScale = pinchStartScale.current * (dist / start);
            setScaleNow(nextScale);
          } else {
            setTranslateNow(lastTx.current + g.dx, lastTy.current + g.dy);
          }
        },
        onPanResponderRelease: (_evt, g) => {
          lastTx.current = lastTx.current + g.dx;
          lastTy.current = lastTy.current + g.dy;
          scale.stopAnimation((s) => {
            lastScale.current = clamp(s, MIN_SCALE, MAX_SCALE);
          });
        },
        onPanResponderTerminationRequest: () => true,
      }),
    []
  );

  const openSpace = (id: RegionId) => setSelected(id);
  const closeSheet = () => setSelected(null);

  return (
    <View style={styles.root}>
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Animated.View
          collapsable={false}
          style={{ transform: [{ translateX }, { translateY }, { scale }] }}
        >
          {/* Visual del mapa */}
          <Svg width={800} height={520} viewBox="0 0 800 520">
            <G>
              <Rect x={0} y={0} width={800} height={520} fill="#F3F4F6" />
              <Rect x={80} y={80} width={320} height={200} fill="#60A5FA" stroke="#1D4ED8" strokeWidth={3} rx={14} />
              <Rect x={520} y={300} width={180} height={140} fill="#F472B6" stroke="#BE185D" strokeWidth={3} rx={20} />
            </G>
          </Svg>

          {/* Overlays de toque (fiables con transform) */}
          <View style={styles.overlay} pointerEvents="box-none">
            <Pressable
              style={[styles.zone, styles.zoneHall]}
              onPress={() => openSpace("hall")}
              hitSlop={10}
            />
            <Pressable
              style={[styles.zone, styles.zonePecera]}
              onPress={() => openSpace("pecera")}
              hitSlop={10}
            />
          </View>
        </Animated.View>
      </View>

      <SpaceBottomSheet selectedSpace={selected} onClose={closeSheet} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f172a" },
  canvas: { flex: 1, overflow: "hidden", backgroundColor: "#111827" },

  // Capa de overlays alineada al SVG (mismas dimensiones)
  overlay: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 800,
    height: 520,
  },
  zone: {
    position: "absolute",
    // transparente pero clickeable en Android
    backgroundColor: "rgba(0,0,0,0.001)",
  },
  zoneHall: {
    left: 80,
    top: 80,
    width: 320,
    height: 200,
    borderRadius: 14,
  },
  zonePecera: {
    left: 520,
    top: 300,
    width: 180,
    height: 140,
    borderRadius: 20,
  },
});