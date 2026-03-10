import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1d3f5d" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Gradient Header */}
      <LinearGradient colors={["#1d3f5d", "#0F2027"]} style={styles.headerBackground}>
        <View style={styles.header}>
          <MaterialIcons name="edit" size={40} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Editar Perfil Profissional</Text>
          <Text style={styles.headerSubtitle}>Atualize suas informações profissionais</Text>
        </View>
      </LinearGradient>

      {/* Content Card */}
      <View style={styles.contentCard}>
        <Text style={styles.label}>Nome:</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Seu nome completo"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Cidade:</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          style={styles.input}
          placeholder="Cidade onde atua"
          placeholderTextColor="#999"
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
          placeholderTextColor="#999"
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  headerBackground: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#E0E6ED",
    marginTop: 8,
    textAlign: "center",
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 12,
    fontWeight: "600",
    color: "#263238",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E6ED",
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    color: "#1C1C1E",
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#1d3f5d",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#A0A0A0",
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default EditProfessionalProfile;