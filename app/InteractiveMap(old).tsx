import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import Svg, { Rect } from "react-native-svg";

type RegionId = "cara" | "ojoizquierdo" | "ojoderecho" | "boca";

const REGION_INFO: Record<
  RegionId,
  { nombre: string; desc?: string; foto?: any }
> = {
  cara: { nombre: "Cara", desc: "La base principal de la figura." },
  ojoizquierdo: { nombre: "Ojo izquierdo", desc: "Este es el ojo izquierdo." },
  ojoderecho: { nombre: "Ojo derecho", desc: "Este es el ojo derecho." },
  boca: { nombre: "Boca", desc: "Aquí está la boca." },
};

export default function InteractiveMap() {
  const [selected, setSelected] = useState<RegionId | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Svg width="100%" height="100%" viewBox="0 0 566 406">
        {/* Fondo */}
        <Rect width={566} height={406} fill="white" />

        {/* Cara */}
        <Rect
          id="cara"
          x={24}
          y={71}
          width={519}
          height={264}
          fill="#D9D9D9"
          onPress={() => setSelected("cara")}
        />

        {/* Ojo izquierdo */}
        <Rect
          id="ojoizquierdo"
          x={73}
          y={99}
          width={151}
          height={92}
          fill="#F63A3A"
          onPress={() => setSelected("ojoizquierdo")}
        />

        {/* Ojo derecho */}
        <Rect
          id="ojoderecho"
          x={326}
          y={93}
          width={140}
          height={87}
          fill="#EDF943"
          onPress={() => setSelected("ojoderecho")}
        />

        {/* Boca */}
        <Rect
          id="boca"
          x={104}
          y={227}
          width={337}
          height={65}
          fill="#4D4B4B"
          onPress={() => setSelected("boca")}
        />
      </Svg>

      {/* Modal con info */}
      <Modal visible={!!selected} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>
              {selected ? REGION_INFO[selected].nombre : ""}
            </Text>
            {selected && REGION_INFO[selected].foto && (
              <Image
                source={REGION_INFO[selected].foto}
                style={styles.image}
                resizeMode="cover"
              />
            )}
            <Text style={styles.desc}>
              {selected ? REGION_INFO[selected].desc : ""}
            </Text>

            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 14,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  desc: {
    marginVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  image: {
    width: "100%",
    height: 150,
    marginVertical: 8,
    borderRadius: 8,
  },
  closeBtn: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  closeText: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
