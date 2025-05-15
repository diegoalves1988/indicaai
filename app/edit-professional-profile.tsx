import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
    return <View style={styles.container}><Text>Carregando...</Text></View>;
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

      <Button title="Salvar Alterações" onPress={handleUpdate} disabled={loading} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top", // Para alinhar o texto no topo em Android
  },
});

export default EditProfessionalProfile;