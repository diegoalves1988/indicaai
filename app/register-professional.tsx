import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import SpecialtySelector from "../components/SpecialtySelector";
import { useAuth } from "../hooks/useAuth";
import { db } from "../services/firebase";
import { registerProfessional } from "../services/professionalService";

const RegisterProfessional = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        <Text style={styles.label}>Nome:</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Digite seu nome"
          style={styles.input}
        />

        <Text style={styles.label}>Categoria (opcional):</Text>
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="Ex.: Eletricista, Encanador"
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Localização</Text>
        <Text style={styles.label}>Cidade:</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Digite sua cidade"
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Especialidades</Text>
        <SpecialtySelector
          selectedSpecialties={selectedSpecialties}
          onChange={setSelectedSpecialties}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RegisterProfessional;