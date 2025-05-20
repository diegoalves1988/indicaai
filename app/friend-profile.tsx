import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../hooks/useAuth";
import { getProfessionals } from "../services/professionalService";
import { getUserProfile, removeFriend } from "../services/userService";

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

        // Busca todos os profissionais
        const professionals = await getProfessionals();

        // Filtra os profissionais recomendados pelo amigo
        const filteredProfessionals = professionals.filter(
          (prof) => prof.recommendedBy && prof.recommendedBy.includes(friendId)
        );

        setRecommendedProfessionals(filteredProfessionals);
      } catch (error) {
        console.error("Erro ao buscar perfil do amigo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendProfile();
  }, [friendId]);

  const handleRemoveFriend = async () => {
    if (!user || !friendId) return;

    try {
      Alert.alert(
        "Remover amigo",
        `Tem certeza que deseja remover ${friend?.name} dos seus amigos?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            onPress: async () => {
              await removeFriend(user.uid, friendId.toString());
              Alert.alert("Sucesso", "Amigo removido com sucesso!");
              router.back();
            },
            style: "destructive",
          },
        ]
      );
    } catch (error) {
      console.error("Erro ao remover amigo:", error);
      Alert.alert("Erro", "Não foi possível remover o amigo");
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  if (!friend) {
    return <View style={styles.centered}><Text>Amigo não encontrado.</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileHeader}>
          <UserAvatar photoURL={friend.photoURL} name={friend.name} size={120} />
          <Text style={styles.name}>{friend.name}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>E-mail:</Text>
            <Text style={styles.infoValue}>{friend.email || "Não informado"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cidade:</Text>
            <Text style={styles.infoValue}>{friend.city || "Não informada"}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.button, styles.removeButton]} onPress={handleRemoveFriend}>
          <Text style={styles.buttonText}>Remover Amigo</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profissionais Recomendados</Text>
          {recommendedProfessionals.length > 0 ? (
            recommendedProfessionals.map((prof) => (
              <View key={prof.id} style={styles.professionalItem}>
                <Text style={styles.professionalName}>{prof.name}</Text>
                <Text style={styles.professionalInfo}>
                  {prof.category} | {prof.city}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.infoValue}>Este amigo ainda não recomendou nenhum profissional.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // updated to match home.tsx
  },
  contentContainer: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // updated
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 15,
    color: "#1d3f5d", // updated to primary blue
    textAlign: "center",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1d3f5d", // updated to primary blue
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  infoValue: {
    fontSize: 16,
    color: "#1C1C1E", // updated for consistency
    flexShrink: 1,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  removeButton: {
    backgroundColor: "#DC3545",
  },
  professionalItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  professionalName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1d3f5d", // updated to primary blue
  },
  professionalInfo: {
    fontSize: 16,
    color: "#555", // subtle info
  },
});

export default FriendProfileScreen;