import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Button, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { getProfessionals, recommendProfessional, removeRecommendation } from "../../services/professionalService";
import { getSuggestedFriends, addFriend } from "../../services/userService";
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [userData, setUserData] = useState(null);
  const [isProfessional, setIsProfessional] = useState(false);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [professionals, setProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchProfessionals = async () => {
    try {
      const professionalsList = await getProfessionals();
      setProfessionals(professionalsList);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
    } finally {
      setLoadingProfessionals(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            setIsProfessional(data.professionalProfile === true);
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
          setSuggestedFriends(suggestions);
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
        prof.name?.toLowerCase().includes(searchLower) || // Verifica se 'name' existe
        prof.city?.toLowerCase().includes(searchLower) || // Verifica se 'city' existe
        prof.specialty?.toLowerCase().includes(searchLower) || // Verifica se 'specialty' existe
        prof.category?.toLowerCase().includes(searchLower) // Verifica se 'category' existe
      );
    });
    setFilteredProfessionals(filtered);
  }, [searchQuery, professionals]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        getSuggestedFriends(user.uid).then(setSuggestedFriends).catch(console.error);
      }
    }, [user?.uid])
  );

  useFocusEffect(
    React.useCallback(() => {
      fetchProfessionals();
    }, [])
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
    return professional?.recommendedBy?.includes(user.uid);
  };

  const handleRecommend = async (professionalId: string) => {
    try {
      if (user) {
        await recommendProfessional(professionalId, user.uid);
        fetchProfessionals();
      }
    } catch (error) {
      console.error("Erro ao recomendar profissional:", error);
    }
  };

  const handleRemoveRecommendation = async (professionalId: string) => {
    try {
      if (user) {
        await removeRecommendation(professionalId, user.uid);
        fetchProfessionals();
      }
    } catch (error) {
      console.error("Erro ao remover recomendação:", error);
    }
  };

  if (authLoading || loadingProfessionals) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.userInfo}>Bem-vindo, {userData?.name || "Usuário"}</Text>
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
      <FlatList
        data={filteredProfessionals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.professionalItem}>
            <TouchableOpacity onPress={() => router.push({ pathname: "/professional-profile", params: { id: item.id } })}>
              <View>
                <Text style={styles.professionalName}>{item.name}</Text>
                <Text style={styles.professionalInfo}>{item.category} | {item.specialty} | {item.city}</Text>
                <Text style={styles.recommendationCount}>{item.recommendationCount} Recomendações</Text>
              </View>
            </TouchableOpacity>
            {!hasRecommended(item.id) && (
              <Button title="Recomendar" onPress={() => handleRecommend(item.id)} />
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <Text style={styles.title}>Sugestões de Amigos</Text>
      <FlatList
  data={suggestedFriends}
  keyExtractor={(item) => item.id}
  horizontal
  showsHorizontalScrollIndicator={false}
  snapToAlignment="start"
  decelerationRate="fast"
  contentContainerStyle={styles.carouselContainer} // Adicionando o estilo aqui
  renderItem={({ item }) => (
    <View style={styles.carouselItem}>
      <Image
        source={item.photoURL ? { uri: item.photoURL } : require("../../assets/images/avatar_link.jpg")}
        style={styles.avatar}
      />
      <Text style={styles.friendName}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleAddFriend(item.id)}>
        <Text style={styles.addFriendButton}>Adicionar</Text>
      </TouchableOpacity>
    </View>
  )}
/>

      {!isProfessional && (
        <Button title="Quero ser profissional" onPress={() => router.push("register-professional")} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc"
  },
  userInfo: { fontSize: 16, fontWeight: "bold" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  professionalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  professionalName: { fontSize: 18, fontWeight: "bold" },
  professionalInfo: { fontSize: 16, color: "#666" },
  recommendationCount: { fontSize: 14, color: "#888" },
  carouselContainer: {
    paddingHorizontal: 16, // Espaçamento nas bordas do carrossel
    paddingVertical: 20,
    height: 500, // Altura mínima garantida para o carrossel
  },
  carouselItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 8, // Espaçamento lateral entre os itens
    width: 160, // Largura mínima ajustada para os itens
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    height: 160, // Altura dos itens do carrossel ajustada
  },
  avatar: {
    width: 80, // Maior tamanho para as imagens
    height: 80,
    borderRadius: 40, // Tornando a imagem circular
    marginBottom: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "blue",
    textAlign: "center", // Centralizar o texto
  },
  addFriendButton: {
    color: "blue",
    marginTop: 5,
    textAlign: "center",
  },
});

export default HomeScreen;