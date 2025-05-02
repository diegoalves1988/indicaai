import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, Picker } from "react-native";
import { registerProfessional } from "../services/professionalService";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../services/firebase'; // Ajuste o caminho se necessário

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
];

const RegisterProfessional = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [specialty, setSpecialty] = useState(""); // Estado para especialidade
  const [city, setCity] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !specialty || !city) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios!");
      return;
    }

    try {
      console.log("Cadastrando profissional...");
      await registerProfessional({
        userId: user?.uid,
        name,
        category, // Categoria continua opcional
        specialty,
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
    <View style={{ padding: 20 }}>
      <Text>Nome:</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />

      <Text>Categoria (opcional):</Text>
      <TextInput
        value={category}
        onChangeText={setCategory}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />

      <Text>Especialidade:</Text>
      <Picker
        selectedValue={specialty}
        onValueChange={(itemValue) => setSpecialty(itemValue)}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      >
        <Picker.Item label="Selecione uma especialidade" value="" />
        {specialties.map((specialty) => (
          <Picker.Item key={specialty} label={specialty} value={specialty} />
        ))}
      </Picker>

      <Text>Cidade:</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />

      <Button title="Cadastrar" onPress={handleRegister} />
    </View>
  );
};

export default RegisterProfessional;