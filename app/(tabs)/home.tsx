// HomeScreen.tsx reformulado com redirecionamento ao fazer logout, chips, busca, sugestões de amigos e lista de profissionais

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
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
  getProfessionals
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
  specialty?: string | string[];
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

const HomeScreen = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [userData, setUserData] = useState<any>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const categories = ["Construção Civil", "Serviços Gerais"];
  const [topSpecialties, setTopSpecialties] = useState<string[]>([]);

  useEffect(() => {
    if (!user && !authLoading) {
      router.replace("/");
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) setUserData(userProfile);
      const professionalsList = await getProfessionals();
      const full = await Promise.all(
        professionalsList.map(async (prof) => {
          const profile = await getUserProfile(prof.userId!);
          return { ...prof, photoURL: profile?.photoURL, name: profile?.name };
        })
      );
      setProfessionals(full);
      setFilteredProfessionals(full);

      // Dynamic specialties: count and get top 5
      const specialtyCount: Record<string, number> = {};
      full.forEach((prof) => {
        if (Array.isArray(prof.specialty)) {
          prof.specialty.forEach((s) => {
            specialtyCount[s] = (specialtyCount[s] || 0) + 1;
          });
        } else if (prof.specialty) {
          specialtyCount[prof.specialty] = (specialtyCount[prof.specialty] || 0) + 1;
        }
      });
      const sortedSpecialties = Object.entries(specialtyCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s]) => s);
      setTopSpecialties(sortedSpecialties);

      const suggestions = await getSuggestedFriends(user.uid);
      setSuggestedFriends(suggestions);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    const filtered = professionals.filter((prof) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        prof.name?.toLowerCase().includes(query) ||
        prof.city?.toLowerCase().includes(query) ||
        prof.category?.toLowerCase().includes(query) ||
        (Array.isArray(prof.specialty)
          ? prof.specialty.some((s) => s.toLowerCase().includes(query))
          : prof.specialty?.toLowerCase().includes(query));

      const matchCategory = selectedCategory ? prof.category === selectedCategory : true;
      const matchSpecialty = selectedSpecialty
        ? Array.isArray(prof.specialty)
          ? prof.specialty.includes(selectedSpecialty)
          : prof.specialty === selectedSpecialty
        : true;

      return matchSearch && matchCategory && matchSpecialty;
    });
    setFilteredProfessionals(filtered);
  }, [searchQuery, selectedCategory, selectedSpecialty, professionals]);

  const renderProfessional = ({ item }: { item: Professional }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: "/professional-profile", params: { id: item.id } })}
    >
      <UserAvatar photoURL={item.photoURL} name={item.name} size={64} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.role}>{Array.isArray(item.specialty) ? item.specialty[0] : item.specialty}</Text>
      <Text style={styles.city}>{item.city}</Text>
      <View style={styles.recommendationRow}>
        <Ionicons name="star" size={16} color="#ffd700" />
        <Text style={styles.recommendationText}>{item.recommendationCount || 0} recomendações</Text>
      </View>
    </TouchableOpacity>
  );

  if (authLoading || loadingData) {
    return <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient colors={["#1d3f5d", "#0F2027"]} style={styles.header}>
        <View style={styles.userInfoContainer}>
          <UserAvatar photoURL={userData?.photoURL} name={userData?.name} size={40} />
          <Text style={styles.userInfoText}>Olá, {userData?.name || "Usuário"}</Text>
        </View>
        <TouchableOpacity onPress={async () => { await signOut(auth); }} style={styles.signOutButton}>
          <Ionicons name="exit-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

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

      <View style={styles.chipsContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              selectedCategory === cat && { backgroundColor: "#007AFF" }
            ]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            <Text style={styles.chipText}>{cat}</Text>
          </TouchableOpacity>
        ))}
        {topSpecialties.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.chip,
              selectedSpecialty === s && { backgroundColor: "#007AFF" }
            ]}
            onPress={() => setSelectedSpecialty(selectedSpecialty === s ? null : s)}
          >
            <Text style={styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Profissionais em destaque</Text>

      <FlatList
        data={filteredProfessionals}
        renderItem={renderProfessional}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        scrollEnabled={false}
      />

      {suggestedFriends.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionTitle}>Sugestões de Amigos</Text>
          <FlatList
            data={suggestedFriends}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "../friend-profile", params: { friendId: item.id } })}
                style={{ marginHorizontal: 10, alignItems: "center" }}
              >
                <UserAvatar photoURL={item.photoURL} name={item.name} size={60} />
                <Text numberOfLines={1} style={{ maxWidth: 100 }}>{item.name}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    await addFriend(user!.uid, item.id);
                    const updated = await getSuggestedFriends(user!.uid);
                    setSuggestedFriends(updated);
                    Alert.alert("Amigo adicionado!", "Vocês agora estão conectados.");
                  }}
                  style={{ backgroundColor: "#4CAF50", padding: 6, borderRadius: 10, marginTop: 4 }}
                >
                  <Text style={{ color: "white", fontSize: 12 }}>Adicionar</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          />
        </View>
      )}

      {!userData?.professionalProfile && (
        <TouchableOpacity
          style={{ margin: 20, backgroundColor: "#FFFFFF", padding: 14, borderRadius: 10, borderColor: "#1d3f5d", borderWidth: 1, alignItems: "center" }}
          onPress={() => router.push("/register-professional")}
        >
          <Text style={{ color: "#1d3f5d", fontWeight: "bold", borderRadius: 18 }}>Quero ser profissional</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userInfoText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    padding: 6
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 50,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginHorizontal: 16,
  },
  searchIcon: {
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#333333",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: "#1d3f5d",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  chipText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 16,
    marginLeft: 16,
    color: "#1C1C1E",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: "47%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  role: {
    fontSize: 14,
    color: "#555",
  },
  city: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  recommendationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: "#000000",
  },
});

export default HomeScreen;