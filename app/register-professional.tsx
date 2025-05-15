import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Checkbox } from "react-native-paper"; // npm install react-native-paper

const specialties = [
  "Pedreiro", "Eletricista", "Encanador", "Jardineiro", "Faxineira",
  "Diarista", "Pintor", "Carpinteiro", "Marceneiro", "Montador de Móveis",
  "Instalador de Câmeras", "Técnico de Informática"
];

const RegisterProfessional = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const filteredSpecialties = specialties.filter((specialty) =>
    specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((item) => item !== specialty)
        : [...prev, specialty]
    );
    setSearchQuery(""); // Limpa a busca
    setIsDropdownVisible(false);
  };

  const removeSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.filter((item) => item !== specialty)
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Especialidades:</Text>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Pesquisar especialidades..."
        style={styles.input}
        onFocus={() => setIsDropdownVisible(true)}
      />

      {isDropdownVisible && searchQuery && (
        <View style={styles.dropdown}>
          <FlatList
            data={filteredSpecialties}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => toggleSpecialty(item)}
              >
                <Checkbox
                  status={
                    selectedSpecialties.includes(item) ? "checked" : "unchecked"
                  }
                  color="#007AFF"
                />
                <Text style={styles.dropdownText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <View style={styles.tagsContainer}>
        {selectedSpecialties.map((specialty) => (
          <View key={specialty} style={styles.tag}>
            <Text style={styles.tagText}>{specialty}</Text>
            <TouchableOpacity onPress={() => removeSpecialty(specialty)}>
              <Text style={styles.tagClose}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    maxHeight: 150,
    borderRadius: 5,
    marginBottom: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  dropdownText: {
    marginLeft: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  tag: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  tagText: {
    marginRight: 5,
  },
  tagClose: {
    fontSize: 16,
    color: "#666",
  },
});

export default RegisterProfessional;
