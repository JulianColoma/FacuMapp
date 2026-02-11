import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Actualizamos el tipo para incluir el color
export type Category = {
  id: string;
  label: string;
  color?: string; // Hexadecimal opcional
};

interface FiltersProps {
  categories: Category[];
  selectedCategory: Category | null; // Ahora es el objeto
  onSelectCategory: (category: Category | null) => void; // Devuelve el objeto
}

export default function Filters({
  categories,
  selectedCategory,
  onSelectCategory,
}: FiltersProps) {
  const [visible, setVisible] = useState(false);

  const handleSelect = (item: Category | { id: string; label: string }) => {
    if (item.id === "all") {
      onSelectCategory(null);
    } else {
      // Pasamos el objeto completo de la categoría
      onSelectCategory(item as Category);
    }
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.iconButton,
          // Si hay algo seleccionado, podemos dar un feedback visual en el botón
          selectedCategory && { borderColor: selectedCategory.color || "#2563EB", borderWidth: 2 }
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="filter" 
          size={22} 
          color={selectedCategory ? (selectedCategory.color || "#2563EB") : "#6B7280"} 
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.popup}>
            <Text style={styles.title}>Filtrar por categoría</Text>

            <FlatList
              data={[{ id: "all", label: "Todas" } as Category, ...categories]}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected =
                  (item.id === "all" && selectedCategory === null) ||
                  item.id === selectedCategory?.id;

                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.optionContent}>
                      {/* Círculo de color al lado del texto */}
                      {item.id !== "all" && (
                        <View 
                          style={[
                            styles.colorDot, 
                            { backgroundColor: item.color || "#CCC" }
                          ]} 
                        />
                      )}
                      
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>

                    {isSelected && (
                      <Ionicons 
                        name="checkmark" 
                        size={18} 
                        color={item.color || "#2563EB"} 
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ... (Tus estilos base se mantienen)
  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#1F2937",
  },
  list: {
    width: "100%",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: "#F3F4F6",
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    color: "#4B5563",
  },
  optionTextSelected: {
    color: "#111827",
    fontWeight: "600",
  },
});