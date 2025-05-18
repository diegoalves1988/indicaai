import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import SpecialtySelector from "../components/SpecialtySelector";
import { useAuth } from "../hooks/useAuth";
import { db } from "../services/firebase";
import { updateProfessional } from "../services/professionalService";

const EditProfessionalProfile = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Buscar o documento do profissional associado ao userId
        const professionalsRef = collection(db, "professionals");
        const q = query(professionalsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const professionalDoc = querySnapshot.docs[0]; // Pega o primeiro resultado
          const data = professionalDoc.data();
          setProfessionalId(professionalDoc.id);
          setName(data.name || "");
          setCity(data.city || "");
          setSelectedSpecialties(data.specialties || []); // Garante que seja um array
          setBio(data.bio || "");
        } else {
          Alert.alert("Erro", "Perfil profissional não encontrado.");
          router.back(); // Volta se não encontrar perfil
        }
      } catch (error) {
        console.error("Erro ao buscar dados do profissional:", error);
        Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [user]);

  const handleUpdate = async () => {
    if (!professionalId) {
      Alert.alert("Erro", "ID do profissional não encontrado.");
      return;
    }
    if (!name || !city || selectedSpecialties.length === 0) {
      Alert.alert("Erro", "Nome, cidade e pelo menos uma especialidade são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      await updateProfessional(professionalId, {
        name,
        city,
        specialties: selectedSpecialties,
        bio,
      });
      Alert.alert("Sucesso", "Perfil profissional atualizado!");
      router.back(); // Volta para a tela anterior após salvar
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert("Erro", "Não foi possível atualizar o perfil.");
    } finally {
      setLoading(false);
    }
  };

   if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#1d3f5d" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nome:</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Seu nome completo"
      />

      <Text style={styles.label}>Cidade:</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        style={styles.input}
        placeholder="Cidade onde atua"
      />

      <SpecialtySelector
        selectedSpecialties={selectedSpecialties}
        onChange={setSelectedSpecialties}
      />

      <Text style={styles.label}>Sobre mim:</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        style={[styles.input, styles.textArea]}
        placeholder="Detalhes sobre seus serviços, experiência, etc."
        multiline
        numberOfLines={4}
      />

        <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleUpdate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Salvar Alterações</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF", // updated to match home.tsx
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "bold",
    color: "#1d3f5d", // updated to primary blue
  },
  button: {
    backgroundColor: "#1d3f5d", // updated to primary blue
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1d3f5d", // updated to primary blue
    padding: 10,
    marginBottom: 15,
    borderRadius: 8, // more rounded
    backgroundColor: "#fff",
    color: "#1C1C1E", // dark text
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top", // Para alinhar o texto no topo em Android
  },
});

export default EditProfessionalProfile;