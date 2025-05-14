import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import UserAvatar from "../components/UserAvatar"; // Importar UserAvatar
import { useAuth } from "../hooks/useAuth";
import { getProfessionalById, removeRecommendation } from "../services/professionalService";
import { getUserProfile } from "../services/userService"; // Importar para buscar dados do usuário

const ProfessionalProfileScreen = () => {
  const { id } = useLocalSearchParams(); // ID do documento do profissional
  const router = useRouter();
  const { user } = useAuth(); // Usuário logado
  const [professional, setProfessional] = useState<any>(null); // Usar 'any' temporariamente ou definir uma interface mais completa
  const [professionalUser, setProfessionalUser] = useState<any>(null); // Dados do usuário do profissional
  const [loading, setLoading] = useState(true);
  const [isRecommended, setIsRecommended] = useState(false);

  useEffect(() => {
    const fetchProfessionalProfile = async () => {
      setLoading(true);
      try {
        if (!id) return;

        const professionalData = await getProfessionalById(id.toString());
        setProfessional(professionalData);

        if (professionalData && professionalData.userId) {
          // Buscar os dados do usuário (que contém photoURL e name para o avatar)
          const profUserData = await getUserProfile(professionalData.userId);
          setProfessionalUser(profUserData);
        }

        const recommendedBy = professionalData?.recommendedBy || [];
        const userHasRecommended = recommendedBy.includes(user?.uid);
        setIsRecommended(userHasRecommended);

      } catch (error) {
        console.error("Erro ao buscar perfil do profissional:", error);
        Alert.alert("Erro", "Não foi possível carregar o perfil do profissional.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalProfile();
  }, [id, user]);

  const handleRemoveRecommendation = async () => {
    if (!professional || !user)
      return;
    Alert.alert(
      "Confirmar remoção",
      `Tem certeza que deseja remover sua indicação de ${professional?.name}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          onPress: async () => {
            try {
              await removeRecommendation(id.toString(), user.uid);
              Alert.alert("Sucesso", "Indicação removida com sucesso!");
              // Idealmente, atualizar o estado local ou forçar um refetch
              setIsRecommended(false); 
              // Considerar voltar para a tela anterior ou atualizar a contagem de recomendações
              // router.push("/recommended-professionals"); // Ou router.back();
            } catch (error) {
              console.error("Erro ao remover indicação:", error);
              Alert.alert("Erro", "Não foi possível remover a indicação.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (!professional) {
    return <View style={styles.centered}><Text>Profissional não encontrado.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <UserAvatar 
          photoURL={professionalUser?.photoURL} 
          name={professionalUser?.name || professional.name} 
          size={100} 
        />
        <Text style={styles.name}>{professional.name}</Text>
      </View>
      
      <Text style={styles.infoTitle}>Informações do Profissional:</Text>
      <Text style={styles.info}>Categoria: {professional.category || "Não informada"}</Text>
      {professional.specialties && professional.specialties.length > 0 && (
        <Text style={styles.info}>Especialidades: {professional.specialties.join(", " )}</Text>
      )}
      <Text style={styles.info}>Cidade: {professional.city || "Não informada"}</Text>
      {/* O telefone do profissional pode estar no documento do profissional ou no documento do usuário dele */}
      {/* <Text style={styles.info}>Telefone: {professional.phone || professionalUser?.phone || "Não informado"}</Text> */}
      <Text style={styles.info}>Recomendações: {professional.recommendationCount || 0}</Text>
      {professional.observations && (
          <Text style={styles.info}>Observações: {professional.observations}</Text>
      )}

      {user && user.uid !== professional.userId && isRecommended && (
        <TouchableOpacity style={styles.removeButton} onPress={handleRemoveRecommendation}>
          <Text style={styles.removeButtonText}>Remover Indicação</Text>
        </TouchableOpacity>
      )}
      {/* Adicionar botão para recomendar se ainda não o fez e não for o próprio perfil */}
      {/* {user && user.uid !== professional.userId && !isRecommended && ( ... ) } */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    marginTop: 15,
    marginBottom: 5,
  },
  info: {
    fontSize: 16,
    marginBottom: 8,
    color: "#555",
    lineHeight: 22,
  },
  removeButton: {
    backgroundColor: "#ff4444",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ProfessionalProfileScreen;

