import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import UserAvatar from "../../components/UserAvatar";
import { useAuth } from "../../hooks/useAuth";
import { auth } from "../../services/firebase";
import {
  getProfessionals,
  recommendProfessional,
  removeRecommendation, // Importar a função de remover recomendação
} from "../../services/professionalService";
import {
  addFriend,
  getSuggestedFriends,
  getUserProfile,
} from "../../services/userService";

interface Professional {
  id: string;
  name?: string;
  category?: string;
  specialty?: string | string[]; // Permitir string ou array de strings
  city?: string;
  recommendationCount?: number;
  recommendedBy?: string[];
  userId?: string;
  photoURL?: string;
}

interface SuggestedFriend {
  id: string;
  name?: string;
  photoURL?: string | null;
}

// Definindo os tipos para os itens da FlatList principal
type HomeScreenListItem = 
  | { type: "header"; userData: any }
  | { type: "search" }
  | { type: "professionalsTitle" }
  | { type: "professionalCard"; professional: Professional }
  | { type: "emptyProfessionals" }
  | { type: "friendsTitle" }
  | { type: "friendsCarousel"; friends: SuggestedFriend[] }
  | { type: "emptyFriends" }
  | { type: "registerProfessionalButton"; isProfessional: boolean };

const HomeScreen = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [userData, setUserData] = useState<any>(null);
  const [isProfessional, setIsProfessional] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!user) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    try {
      // Buscar dados do usuário
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setUserData(userProfile);
        setIsProfessional(userProfile.professionalProfile === true);
      }

      // Buscar profissionais
      const professionalsList = await getProfessionals();
      const professionalsWithDetails = await Promise.all(
        professionalsList.map(async (prof) => {
          if (prof.userId) {
            const profUser = await getUserProfile(prof.userId);
            return { ...prof, photoURL: profUser?.photoURL, name: profUser?.name || prof.name };
          }
          return prof;
        })
      );
      setProfessionals(professionalsWithDetails);

      // Buscar sugestões de amigos
      const suggestions = await getSuggestedFriends(user.uid);
      setSuggestedFriends(suggestions as SuggestedFriend[]);

    } catch (error) {
      console.error("Erro ao buscar dados da Home:", error);
      // Considerar mostrar um erro para o usuário
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchData(); // Atualiza todos os dados ao focar na tela
      }
    }, [user?.uid])
  );

  useEffect(() => {
    const filtered = professionals.filter((prof) => {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = prof.name?.toLowerCase().includes(searchLower);
      const cityMatch = prof.city?.toLowerCase().includes(searchLower);
      const specialtyMatch = Array.isArray(prof.specialty)
        ? prof.specialty.some(s => s.toLowerCase().includes(searchLower))
        : prof.specialty?.toLowerCase().includes(searchLower);
      const categoryMatch = prof.category?.toLowerCase().includes(searchLower);
      return nameMatch || cityMatch || specialtyMatch || categoryMatch;
    });
    setFilteredProfessionals(filtered);
  }, [searchQuery, professionals]);

  useEffect(() => {
    if (!user && isLoggingOut) {
      router.replace("/");
      setIsLoggingOut(false);
    }
  }, [user, isLoggingOut]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsLoggingOut(true);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    try {
      if (user) {
        await addFriend(user.uid, friendId);
        setSuggestedFriends((prev) => prev.filter((friend) => friend.id !== friendId));
        Alert.alert("Amigo adicionado!", "Vocês agora estão conectados.");
      }
    } catch (error) {
      console.error("Erro ao adicionar amigo:", error);
      Alert.alert("Erro", "Não foi possível adicionar o amigo.");
    }
  };

  const hasRecommended = (professionalId: string) => {
    const professional = professionals.find((p) => p.id === professionalId);
    return professional?.recommendedBy?.includes(user!.uid);
  };

  const handleRecommend = async (professionalId: string) => {
    try {
      if (user) {
        await recommendProfessional(professionalId, user.uid);
        fetchData(); // Re-busca para atualizar contagem e status
      }
    } catch (error) {
      console.error("Erro ao recomendar profissional:", error);
    }
  };

  const handleRemoveRecommendation = async (professionalId: string) => {
    try {
      if (user) {
        await removeRecommendation(professionalId, user.uid);
        fetchData(); // Re-busca para atualizar contagem e status
      }
    } catch (error) {
      console.error("Erro ao remover recomendação:", error);
    }
  };

  if (authLoading || loadingData) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />;
  }

  if (!user) return null;

  // Construir os dados para a FlatList principal
  const listData: HomeScreenListItem[] = [
    { type: "header", userData: userData },
    { type: "search" },
    { type: "professionalsTitle" },
    ...(filteredProfessionals.length > 0 
        ? filteredProfessionals.map(p => ({ type: "professionalCard" as const, professional: p }))
        : [{ type: "emptyProfessionals" as const }] 
      ),
    { type: "friendsTitle" },
    suggestedFriends.length > 0 
        ? { type: "friendsCarousel", friends: suggestedFriends }
        : { type: "emptyFriends" }, 
    { type: "registerProfessionalButton", isProfessional: isProfessional },
  ];

  const renderListItem = ({ item }: { item: HomeScreenListItem }) => {
    switch (item.type) {
      case "header":
        return (
          <View style={styles.header}>
            <View style={styles.userInfoContainer}>
              <UserAvatar photoURL={item.userData?.photoURL} name={item.userData?.name} size={40} />
              <Text style={styles.userInfoText}>Bem-vindo, {item.userData?.name || "Usuário"}</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Ionicons name="exit-outline" size={28} color="#007AFF" />
            </TouchableOpacity>
          </View>
        );
      case "search":
        return (
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              placeholder="Busque aqui"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#8E8E93"
            />
          </View>
        );
      case "professionalsTitle":
        return <Text style={styles.sectionTitle}>Profissionais Cadastrados</Text>;
      case "professionalCard":
        const prof = item.professional;
        return (
          <View style={styles.professionalCard}>
            <TouchableOpacity onPress={() => router.push({ pathname: "/professional-profile", params: { id: prof.id } })} style={styles.professionalTouchable}>
              <UserAvatar photoURL={prof.photoURL} name={prof.name} size={60} />
              <View style={styles.professionalDetails}>
                <Text style={styles.professionalName}>{prof.name}</Text>
                <Text style={styles.professionalSubText}>Especialidades: {Array.isArray(prof.specialty) ? prof.specialty.join(", ") : prof.specialty || "N/A"}</Text>
                <Text style={styles.professionalSubText}>Localidade: {prof.city || "N/A"}</Text>
                <View style={styles.recommendationContainer}>
                  <Ionicons name="star-outline" size={16} color="#FFC107" />
                  <Text style={styles.recommendationText}>{prof.recommendationCount || 0} Recomendações</Text>
                </View>
              </View>
            </TouchableOpacity>
            {user && user.uid !== prof.userId && (
              <TouchableOpacity 
                style={[styles.actionButton, hasRecommended(prof.id) ? styles.removeRecommendButton : styles.recommendButton]}
                onPress={() => hasRecommended(prof.id) ? handleRemoveRecommendation(prof.id) : handleRecommend(prof.id)}
              >
                <Text style={styles.actionButtonText}>
                  {hasRecommended(prof.id) ? "Remover Recomendação" : "Recomendar"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case "emptyProfessionals":
        return <Text style={styles.emptyListText}>Nenhum profissional encontrado.</Text>;
      case "friendsTitle":
        return <Text style={styles.sectionTitle}>Sugestões de Amigos</Text>;
      case "friendsCarousel":
        return (
          <FlatList
            data={item.friends}
            keyExtractor={(friend) => friend.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: friend }) => (
              <View style={styles.friendCard}>
                <UserAvatar photoURL={friend.photoURL} name={friend.name} size={70} />
                <Text style={styles.friendName} numberOfLines={2}>{friend.name}</Text>
                <TouchableOpacity onPress={() => handleAddFriend(friend.id)} style={styles.addFriendButton}>
                  <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.addFriendButtonText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.friendsCarouselContainer}
          />
        );
      case "emptyFriends":
        return <Text style={styles.emptyListText}>Nenhuma sugestão de amigo no momento.</Text>; 
      case "registerProfessionalButton":
        return (
          !item.isProfessional && (
            <View style={styles.registerProfessionalButtonContainer}>
              <TouchableOpacity onPress={() => router.push("register-professional")} style={styles.registerProfessionalButton}>
                <Text style={styles.registerProfessionalButtonText}>Quero ser profissional</Text>
              </TouchableOpacity>
            </View>
          )
        );
      default:
        return null;
    }
  };

  return (
    <FlatList
      data={listData}
      renderItem={renderListItem}
      keyExtractor={(item, index) => item.type + index}
      style={styles.container}
      contentContainerStyle={styles.mainListContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F0F2F5" // Um cinza mais claro para o fundo
  },
  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfoText: {
    fontSize: 18,
    fontWeight: "600", // Um pouco mais de peso
    marginLeft: 12,
    color: "#333333"
  },
  signOutButton: {
    padding: 8, // Para facilitar o toque
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Mais arredondado
    height: 50,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginHorizontal: 16, // Adicionado para não colar nas bordas
  },
  searchIcon: {
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#333333"
  },
  sectionTitle: {
    fontSize: 22, // Maior
    fontWeight: "bold",
    marginTop: 24, // Mais espaço acima
    marginBottom: 16, // Mais espaço abaixo
    paddingHorizontal: 20,
    color: "#1C1C1E"
  },
  professionalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  professionalTouchable: {
    flexDirection: "row",
    alignItems: "flex-start", // Alinhar ao topo para nomes longos
  },
  professionalDetails: {
    marginLeft: 16,
    flex: 1,
  },
  professionalName: {
    fontSize: 18, // Um pouco maior
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  professionalSubText: {
    fontSize: 14,
    color: "#555555",
    marginBottom: 3,
    lineHeight: 20, // Melhorar leitura
  },
  recommendationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: "#555555",
    marginLeft: 6,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  recommendButton: {
    backgroundColor: "#007AFF", // Azul primário
  },
  removeRecommendButton: {
    backgroundColor: "#FF3B30", // Vermelho para remoção
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyListText: {
    textAlign: "center",
    marginVertical: 30,
    color: "#8E8E93",
    fontSize: 16,
    paddingHorizontal: 20,
  },
  friendsCarouselContainer: {
    paddingHorizontal: 16, // Espaçamento nas laterais do carrossel
    paddingVertical: 10,
  },
  friendCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginRight: 12, // Espaço entre os cards de amigos
    width: 160, // Largura fixa para consistência
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    minHeight: 200, // Para acomodar conteúdo
    justifyContent: "space-between"
  },
  friendName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  addFriendButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50", // Verde para adicionar
    borderRadius: 20, // Mais arredondado
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addFriendButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  registerProfessionalButtonContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40, // Mais espaço no final
  },
  registerProfessionalButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  registerProfessionalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  mainListContent: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 40, // Espaço extra no final da lista
  }
});

export default HomeScreen;

