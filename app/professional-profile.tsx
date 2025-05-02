import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getProfessionalById, removeRecommendation } from "../services/professionalService";
import { useAuth } from "../hooks/useAuth";

const ProfessionalProfileScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecommended, setIsRecommended] = useState(false);

  useEffect(() => {
    const fetchProfessionalProfile = async () => {
      try {
        if (!id) return;
  
        const professionalData = await getProfessionalById(id.toString());
        setProfessional(professionalData);
  
        // Pegando a lista correta de recomendações
        const recommendedBy = professionalData?.recommendedBy || [];
  
        console.log("recommendedBy (raw):", recommendedBy);
        console.log("User UID:", user?.uid);
  
        // Verificar se o usuário está na lista
        const userHasRecommended = recommendedBy.includes(user?.uid);
  
        setIsRecommended(userHasRecommended);
  
        console.log("Is recommended? (final check):", userHasRecommended);
  
      } catch (error) {
        console.error("Erro ao buscar perfil do profissional:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProfessionalProfile();
  }, [id, user]);
  
  

  const handleRemoveRecommendation = async () => {
    Alert.alert(
      "Confirmar remoção",
      `Tem certeza que deseja remover sua indicação de ${professional?.name}?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Remover",
          onPress: async () => {
            try {
              await removeRecommendation(id.toString(), user.uid);
              Alert.alert("Sucesso", "Indicação removida com sucesso!");
              router.push("/recommended-professionals");
            } catch (error) {
              console.error("Erro ao remover indicação:", error);
              Alert.alert("Erro", "Não foi possível remover a indicação");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <View style={styles.container}>
      {professional ? (
        <>
          <Text style={styles.name}>{professional.name}</Text>
          <Text style={styles.info}>Categoria: {professional.category}</Text>
          <Text style={styles.info}>Cidade: {professional.city}</Text>
          <Text style={styles.info}>Telefone: {professional.phone}</Text>
          <Text style={styles.info}>Recomendações: {professional.recommendationCount || 0}</Text>

          {isRecommended && (
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={handleRemoveRecommendation}
            >
              <Text style={styles.removeButtonText}>Remover Indicação</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text>Profissional não encontrado.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  name: { 
    fontSize: 24, 
    fontWeight: "bold",
    marginBottom: 10
  },
  info: { 
    fontSize: 16, 
    marginBottom: 10,
    color: '#333'
  },
  removeButton: { 
    backgroundColor: "#ff4444", 
    padding: 12, 
    borderRadius: 5, 
    marginTop: 20,
    alignItems: "center"
  },
  removeButtonText: { 
    color: "white", 
    fontWeight: "bold",
    fontSize: 16
  }
});

export default ProfessionalProfileScreen;
