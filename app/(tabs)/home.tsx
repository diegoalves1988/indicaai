import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"; // Removido Image, adicionado Platform
import UserAvatar from "../../components/UserAvatar"; // Importar UserAvatar
import { useAuth } from "../../hooks/useAuth";
import { auth } from "../../services/firebase";
import { getProfessionals, recommendProfessional } from "../../services/professionalService";
import { addFriend, getSuggestedFriends, getUserProfile } from "../../services/userService"; // Adicionado getUserProfile

interface Professional {
  id: string;
  name?: string;
  category?: string;
  specialty?: string;
  city?: string;
  recommendationCount?: number;
  recommendedBy?: string[];
  userId?: string; // Adicionar userId para buscar photoURL
  photoURL?: string; // Para armazenar photoURL diretamente se já obtido
  // Adicionar outros campos conforme necessário
}

interface SuggestedFriend {
  id: string;
  name?: string;
  photoURL?: string | null;
  // Adicionar outros campos conforme necessário
}

const HomeScreen = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [userData, setUserData] = useState<any>(null);
  const [isProfessional, setIsProfessional] = useState(false);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProfessionalsWithUserDetails = async () => {
    setLoadingProfessionals(true);
    try {
      const professionalsList = await getProfessionals();
      // Para cada profissional, buscar o photoURL do usuário correspondente
      const professionalsWithDetails = await Promise.all(
        professionalsList.map(async (prof) => {
          if (prof.userId) {
            const profUser = await getUserProfile(prof.userId);
            return { ...prof, photoURL: profUser?.photoURL, name: profUser?.name || prof.name }; // Usa o nome do perfil de usuário se disponível
          }
          return prof;
        })
      );
      setProfessionals(professionalsWithDetails);
    } catch (error) {
      console.error("Erro ao buscar profissionais com detalhes:", error);
    } finally {
      setLoadingProfessionals(false);
    }
  };

  useEffect(() => {
    fetchProfessionalsWithUserDetails();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const userProfile = await getUserProfile(user.uid);
          if (userProfile) {
            setUserData(userProfile);
            setIsProfessional(userProfile.professionalProfile === true);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const fetchSuggestedFriends = async () => {
        try {
          const suggestions = await getSuggestedFriends(user.uid);
          setSuggestedFriends(suggestions as SuggestedFriend[]);
        } catch (error) {
          console.error("Erro ao buscar sugestões de amigos:", error);
        }
      };
      fetchSuggestedFriends();
    }
  }, [user]);

  useEffect(() => {
    const filtered = professionals.filter((prof) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        prof.name?.toLowerCase().includes(searchLower) ||
        prof.city?.toLowerCase().includes(searchLower) ||
        (prof.specialty && prof.specialty.toLowerCase().includes(searchLower)) || // Corrigido para specialty ser string
        prof.category?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredProfessionals(filtered);
  }, [searchQuery, professionals]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        getSuggestedFriends(user.uid).then(data => setSuggestedFriends(data as SuggestedFriend[])).catch(console.error);
      }
      fetchProfessionalsWithUserDetails(); // Atualiza profissionais ao focar na tela
    }, [user?.uid])
  );

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
      }
    } catch (error) {
      console.error("Erro ao adicionar amigo:", error);
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
        fetchProfessionalsWithUserDetails(); // Re-busca para atualizar contagem e status
      }
    } catch (error) {
      console.error("Erro ao recomendar profissional:", error);
    }
  };

  // handleRemoveRecommendation não é usado diretamente nesta tela, mas pode ser se houver um botão de "Remover Recomendação" aqui.

  if (authLoading || loadingProfessionals) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  }

  if (!user) return null; // Ou redirecionar para login

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfoContainer}>
            <UserAvatar photoURL={userData?.photoURL} name={userData?.name} size={30} />
            <Text style={styles.userInfoText}>Bem-vindo, {userData?.name || "Usuário"}</Text>
        </View>
        <Button title="Sair" onPress={handleSignOut} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Buscar por nome, cidade, especialidade..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      <Text style={styles.title}>Profissionais Cadastrados</Text>
      {filteredProfessionals.length === 0 && !loadingProfessionals && (
          <Text style={styles.emptyListText}>Nenhum profissional encontrado.</Text>
      )}
      <FlatList
        data={filteredProfessionals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.professionalItem}>
            <TouchableOpacity onPress={() => router.push({ pathname: "/professional-profile", params: { id: item.id } })} style={styles.professionalTouchable}>
              <UserAvatar photoURL={item.photoURL} name={item.name} size={50} />
              <View style={styles.professionalDetails}>
                <Text style={styles.professionalName}>{item.name}</Text>
                <Text style={styles.professionalInfo}>{item.category} | {Array.isArray(item.specialty) ? item.specialty.join(", ") : item.specialty} | {item.city}</Text>
                <Text style={styles.recommendationCount}>{item.recommendationCount || 0} Recomendações</Text>
              </View>
            </TouchableOpacity>
            {user && user.uid !== item.userId && !hasRecommended(item.id) && (
              <Button title="Recomendar" onPress={() => handleRecommend(item.id)} />
            )}
             {user && user.uid !== item.userId && hasRecommended(item.id) && (
              <Button title="Remover Recomendação" onPress={() => console.log("Remover recomendação aqui ou na tela de perfil")} color="#FF6347" />
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loadingProfessionals && filteredProfessionals.length === 0 ? <Text style={styles.emptyListText}>Nenhum profissional encontrado com os filtros atuais.</Text> : null}
      />

      <Text style={styles.title}>Sugestões de Amigos</Text>
      {suggestedFriends.length === 0 && !loadingProfessionals && (
          <Text style={styles.emptyListText}>Nenhuma sugestão de amigo no momento.</Text>
      )}
      <FlatList
        data={suggestedFriends}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.carouselItem}>
            <UserAvatar photoURL={item.photoURL} name={item.name} size={60} />
            <Text style={styles.friendName}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleAddFriend(item.id)} style={styles.addFriendButtonContainer}>
              <Text style={styles.addFriendButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.carouselContainer}
        ListEmptyComponent={!loadingProfessionals && suggestedFriends.length === 0 ? <Text style={styles.emptyListText}>Nenhuma sugestão de amigo no momento.</Text> : null}
      />

      {!isProfessional && (
        <View style={styles.registerProfessionalButtonContainer}>
            <Button title="Quero ser profissional" onPress={() => router.push("register-professional")} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  userInfoContainer: { flexDirection: "row", alignItems: "center" },
  userInfoText: { fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  title: { fontSize: 20, fontWeight: "bold", marginTop: 20, marginBottom: 10, paddingHorizontal: 16 },
  searchContainer: { paddingHorizontal: 16, marginTop: 10 },
  searchInput: { height: 45, borderColor: "#BDBDBD", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 10, backgroundColor: "#FFFFFF" },
  professionalItem: { flexDirection: "row", alignItems: "center", padding: 16, marginVertical: 8, marginHorizontal:16, backgroundColor: "#FFFFFF", borderRadius: 8, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  professionalTouchable: { flexDirection: "row", alignItems: "center", flex: 1 },
  professionalDetails: { marginLeft: 12, flex: 1 },
  professionalName: { fontSize: 18, fontWeight: "bold", color: "#333333" },
  professionalInfo: { fontSize: 14, color: "#757575", marginTop: 2 },
  recommendationCount: { fontSize: 12, color: "#757575", marginTop: 2 },
  listContent: { paddingBottom: 20 },
  emptyListText: { textAlign: "center", marginTop: 20, color: "#757575", fontSize: 16 },
  carouselContainer: { paddingHorizontal: 8, paddingVertical: 10 }, // Ajustado padding
  carouselItem: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 12, marginHorizontal: 8, width: 150, alignItems: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2.5, minHeight: 170, justifyContent:"space-between" },
  friendName: { fontSize: 15, fontWeight: "600", color: "#424242", textAlign: "center", marginTop: 8, flexShrink:1 },
  addFriendButtonContainer: { backgroundColor: "#E3F2FD", borderRadius: 15, paddingVertical: 6, paddingHorizontal: 12, marginTop: 8 },
  addFriendButtonText: { color: "#0D47A1", fontWeight: "bold", fontSize: 13 },
  registerProfessionalButtonContainer: { marginHorizontal: 16, marginTop: 20, marginBottom: 30 }
});

export default HomeScreen;

