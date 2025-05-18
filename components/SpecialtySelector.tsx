import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import specialties from "../services/specialties";

interface SpecialtySelectorProps {
  selectedSpecialties: string[];
  onChange: (specialties: string[]) => void;
}

const SpecialtySelector: React.FC<SpecialtySelectorProps> = ({
  selectedSpecialties,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar especialidades com base na consulta
  const filteredSpecialties = specialties
    .filter((specialty) =>
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 10); // Limitar a 10 resultados para a lista suspensa

  // Alternar seleção de especialidade
  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      onChange(selectedSpecialties.filter((item) => item !== specialty));
    } else {
      onChange([...selectedSpecialties, specialty]);
    }
    setSearchQuery(""); // Limpar o campo de pesquisa após a seleção
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Especialidades:</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar especialidades..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {/* Mostrar especialidades selecionadas */}
        {selectedSpecialties.length > 0 && (
          <View style={styles.selectedContainer}>
            {selectedSpecialties.map((specialty) => (
              <View key={specialty} style={styles.selectedTag}>
                <Text style={styles.selectedItem}>{specialty}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {/* Lista suspensa de sugestões */}
      {searchQuery.length > 0 && (
        <FlatList
          style={styles.dropdown}
          data={filteredSpecialties}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => toggleSpecialty(item)}
            >
              <Text style={styles.dropdownItemText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1d3f5d",
    marginBottom: 10,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    padding: 8,
    fontSize: 16,
  },
  selectedContainer: {
    marginTop: 10,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  selectedTag: {
    backgroundColor: "#E0EFFF",
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedItem: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  dropdown: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    backgroundColor: "#fff",
    maxHeight: 150, // Limitar altura da lista suspensa
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
});

export default SpecialtySelector;