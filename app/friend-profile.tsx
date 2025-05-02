import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter  } from "expo-router";
import { getUserProfile, removeFriend } from "../services/userService";
import { getProfessionals } from "../services/professionalService";
import { useAuth } from "../hooks/useAuth";

const FriendProfileScreen = () => {
  const { friendId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [friend, setFriend] = useState(null);
  const [recommendedProfessionals, setRecommendedProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendProfile = async () => {
      try {
        if (!friendId) return;
        
        // Busca os dados do amigo
        const friendData = await getUserProfile(friendId);
        setFriend(friendData);
        console.log("Amigo encontrado:", friendData);
  
        // Busca todos os profissionais
        const professionals = await getProfessionals();
        console.log("Profissionais encontrados:", professionals);
  
        // Filtra os profissionais recomendados pelo amigo
        const filteredProfessionals = professionals.filter(prof => 
          prof.recommendedBy && prof.recommendedBy.includes(friendId) // 🚀 Corrigido aqui!
        );
  
        console.log("Profissionais recomendados pelo amigo:", filteredProfessionals);
        setRecommendedProfessionals(filteredProfessionals);
      } catch (error) {
        console.error("Erro ao buscar perfil do amigo:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchFriendProfile();
  }, [friendId]);
  
  // Função para lidar com a remoção do amigo
  const handleRemoveFriend = async () => {
    if (!user || !friendId) return;
  
    try {
      // Confirmação antes de remover
      Alert.alert(
        "Remover amigo",
        `Tem certeza que deseja remover ${friend?.name} dos seus amigos?`,
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          { 
            text: "Remover", 
            onPress: async () => {
              await removeFriend(user.uid, friendId.toString());
              Alert.alert("Sucesso", "Amigo removido com sucesso!");
              router.back(); // Volta para a tela anterior
            },
            style: "destructive"
          }
        ]
      );
    } catch (error) {
      console.error("Erro ao remover amigo:", error);
      Alert.alert("Erro", "Não foi possível remover o amigo");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <View style={styles.container}>
      {friend ? (
        <>
          <Text style={styles.name}>{friend.name}</Text>
          <Text style={styles.info}>Telefone: {friend.phone}</Text>

          <TouchableOpacity style={styles.removeButton} onPress={handleRemoveFriend}>
            <Text style={styles.removeButtonText}>Remover amigo</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Profissionais recomendados</Text>
          {recommendedProfessionals.length > 0 ? (
            <FlatList
              data={recommendedProfessionals}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
             <TouchableOpacity onPress={() => router.push({ pathname: "/professional-profile", params: { id: item.id } })}>
              <View style={styles.professionalItem}>
                <Text style={styles.professionalName}>{item.name}</Text>
                <Text style={styles.professionalInfo}>{item.category} | {item.city}</Text>
              </View>
            </TouchableOpacity>
              )}
            />
          ) : (
            <Text>Este amigo ainda não recomendou nenhum profissional.</Text>
          )}
        </>
      ) : (
        <Text>Usuário não encontrado.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  name: { fontSize: 24, fontWeight: "bold" },
  info: { fontSize: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  professionalItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  professionalName: { fontSize: 18, fontWeight: "bold" },
  removeButton: { backgroundColor: "red", padding: 10, borderRadius: 5, marginTop: 10 },
  removeButtonText: { color: "white", textAlign: "center", fontWeight: "bold" }
});

export default FriendProfileScreen;
