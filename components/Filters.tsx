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

type Category = {
  id: string;
  label: string;
};

interface FiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function Filters({
  categories,
  selectedCategory,
  onSelectCategory,
}: FiltersProps) {
  const [visible, setVisible] = useState(false);

  const handleSelect = (id: string | null) => {
    onSelectCategory(id);
    setVisible(false);
  };

  return (
    <>
      {/* ICONO */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="filter" size={22} color="#6B7280" />
      </TouchableOpacity>

      {/* POPUP */}
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
              data={[{ id: "all", label: "Todas" }, ...categories]}
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => {
                const isSelected =
                  (item.id === "all" && selectedCategory === null) ||
                  item.id === selectedCategory;

                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() =>
                      handleSelect(item.id === "all" ? null : item.id)
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#2563EB" />
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
  iconButton: {
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827",
  },

  list: {
    flexGrow: 0,
  },

  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  optionSelected: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 8,
  },

  optionText: {
    fontSize: 14,
    color: "#374151",
  },

  optionTextSelected: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
