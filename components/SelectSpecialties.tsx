import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface SelectSpecialtiesProps {
  specialties: string[];
  selectedSpecialties: string[];
  onChange: (selected: string[]) => void;
}

const SelectSpecialties: React.FC<SelectSpecialtiesProps> = ({
  specialties,
  selectedSpecialties,
  onChange,
}) => {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<string[]>(specialties);

  useEffect(() => {
    if (search.trim() === "") {
      setFiltered(specialties);
    } else {
      const lowerSearch = search.toLowerCase();
      setFiltered(
        specialties.filter((spec) => spec.toLowerCase().includes(lowerSearch))
      );
    }
  }, [search, specialties]);

  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      onChange(selectedSpecialties.filter((s) => s !== spec));
    } else {
      onChange([...selectedSpecialties, spec]);
    }
  };

  const renderItem = ({ item }: { item: string }) => {
    const isSelected = selectedSpecialties.includes(item);
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => toggleSpecialty(item)}
      >
        <Text style={isSelected ? styles.selectedText : styles.itemText}>
          {isSelected ? "✅ " : "⬜️ "} {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Buscar especialidades..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: 250 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  selectedItem: {
    backgroundColor: "#d0f0c0",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedText: {
    fontSize: 16,
    color: "#2a7f2a",
    fontWeight: "bold",
  },
});

export default SelectSpecialties;
