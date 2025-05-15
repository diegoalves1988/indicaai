import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { db } from "../services/firebase";
import { registerProfessional } from "../services/professionalService";

const specialties = [
  "Pedreiro",
  "Eletricista",
  "Encanador",
  "Jardineiro",
  "Faxineira",
  "Diarista",
  "Pintor",
  "Carpinteiro",
  "Marceneiro",
  "Montador de Móveis",
  "Instalador de Câmeras",
  "Técnico de Informática",
];

const RegisterProfessional = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || selectedSpecialties.length === 0 || !city) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios!");
      return;
    }

    try {
      console.log("Cadastrando profissional...");
      await registerProfessional({
        userId: user?.uid,
        name,
        category, // Categoria continua opcional
        specialty: selectedSpecialties, // Usando o array de especialidades
        city,
      });

      // ✅ Atualiza o campo professionalProfile na coleção "users"
      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
          professionalProfile: true,
        });
        console.log("Campo 'professionalProfile' atualizado com sucesso!");
      }

      Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Erro ao cadastrar profissional:", error);
      Alert.alert("Erro", "Falha ao cadastrar profissional.");
    }
  };

  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties((prev) => prev.filter((item) => item !== specialty));
    } else {
      setSelectedSpecialties((prev) => [...prev, specialty]);
    }
  };

  const filteredSpecialties = specialties.filter((specialty) =>
    specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text>Nome:</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Text>Categoria (opcional):</Text>
      <TextInput
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />

      <Text>Especialidades:</Text>
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Pesquisar especialidades..."
        style={styles.searchInput}
      />
      <FlatList
        data={filteredSpecialties}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.specialtyItem,
              selectedSpecialties.includes(item) && styles.selectedSpecialty,
            ]}
            onPress={() => toggleSpecialty(item)}
          >
            <Text
              style={[
                styles.specialtyText,
                selectedSpecialties.includes(item) && styles.selectedSpecialtyText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text>Cidade:</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        style={styles.input}
      />

      <Button title="Cadastrar" onPress={handleRegister} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderBottomWidth: 1, marginBottom: 10 },
  searchInput: {
    borderBottomWidth: 1,
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#f9f9f9",
  },
  specialtyItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  selectedSpecialty: {
    backgroundColor: "#007AFF",
  },
  specialtyText: {
    fontSize: 16,
  },
  selectedSpecialtyText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default RegisterProfessional;