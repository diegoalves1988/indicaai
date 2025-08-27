// HomeScreen.tsx reformulado com redirecionamento ao fazer logout, chips, busca, sugestões de amigos e lista de profissionais

import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  filterProfessionalsByRating,
  getProfessionals
} from "../../services/professionalService";
import {
  addFavorite,
  addFriend,
  getFavorites,
  getSuggestedFriends,
  getUserProfile,
  removeFavorite
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
  totalRatings?: number;
  averageRating?: number;
  showRating?: boolean;
}

interface SuggestedFriend {
  userId: string;
  name?: string;
  photoURL?: string | null;
}

interface ActiveFilters {
  minRating: number | null;
  specialties: string[];
  maxDistance: number | null;
}

const HomeScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const initialRender = useRef(true);
  const filtersCleared = useRef(false);

  const [userData, setUserData] = useState<any>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [topSpecialties, setTopSpecialties] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    minRating: null,
    specialties: [],
    maxDistance: null
  });
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!user && !authLoading) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  // Atualiza os filtros ativos quando os parâmetros de URL mudam
  // Usando useRef para evitar loop infinito
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    // Se os filtros foram limpos, não processe os parâmetros
    if (filtersCleared.current) {
      filtersCleared.current = false;
      return;
    }

    if (params) {
      const minRating = params.minRating ? Number(params.minRating) : null;
      const specialties = params.specialties ? String(params.specialties).split(',') : [];
      const maxDistance = params.maxDistance ? Number(params.maxDistance) : null;

      // Verificar se os filtros realmente mudaram antes de atualizar o estado
      if (
        minRating !== activeFilters.minRating ||
        JSON.stringify(specialties) !== JSON.stringify(activeFilters.specialties) ||
        maxDistance !== activeFilters.maxDistance
      ) {
        setActiveFilters({
          minRating,
          specialties,
          maxDistance
        });

        // Se houver especialidades nos filtros, seleciona a primeira como filtro de especialidade
        if (specialties.length > 0 && specialties[0] !== selectedSpecialty) {
          setSelectedSpecialty(specialties[0]);
        }
      }
    }
  }, [params, activeFilters, selectedSpecialty]);

  // Função para buscar dados
  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoadingData(true);

    try {
      // Buscar perfil do usuário
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) setUserData(userProfile);

      // Buscar todos os profissionais
      let professionalsList = await getProfessionals();

      // Aplicar filtro de avaliação se necessário
      if (activeFilters.minRating !== null) {
        const filteredIds = await filterProfessionalsByRating(activeFilters.minRating);
        professionalsList = professionalsList.filter(prof => filteredIds.includes(prof.id));
      }

      // Buscar informações adicionais para cada profissional
      const professionalPromises = professionalsList.map(async (prof) => {
        try {
          const profile = await getUserProfile(prof.userId || "");
          return {
            ...prof,
            photoURL: profile?.photoURL,
            name: profile?.name
          };
        } catch (error) {
          console.error("Erro ao buscar perfil do profissional:", error);
          return prof;
        }
      });

      const fullProfessionals = await Promise.all(professionalPromises);
      setProfessionals(fullProfessionals);

      // Extrair especialidades para os chips
      const specialtyCount: Record<string, number> = {};
      fullProfessionals.forEach((prof) => {
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

      // Buscar sugestões de amigos
      const suggestions = await getSuggestedFriends(user.uid);
      setSuggestedFriends(suggestions);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoadingData(false);
    }
  }, [user, activeFilters.minRating]);

  // Usar useFocusEffect para buscar dados quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchData();
      }

      return () => {
        // Cleanup function if needed
      };
    }, [fetchData, user])
  );

  // Filtrar profissionais com base na busca e filtros selecionados
  useEffect(() => {
    if (professionals.length === 0) return;

    const filtered = professionals.filter((prof) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        (prof.name?.toLowerCase().includes(query) || false) ||
        (prof.city?.toLowerCase().includes(query) || false) ||
        (prof.category?.toLowerCase().includes(query) || false) ||
        (Array.isArray(prof.specialty)
          ? prof.specialty.some((s) => s.toLowerCase().includes(query))
          : (prof.specialty?.toLowerCase().includes(query) || false));

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

  // Função para limpar filtros
  const handleClearFilters = useCallback(() => {
    // Marcar que os filtros foram limpos manualmente
    filtersCleared.current = true;

    // Limpar os parâmetros da URL
    router.replace({
      pathname: '/(tabs)/home'
    });

    // Resetar os estados locais
    setActiveFilters({
      minRating: null,
      specialties: [],
      maxDistance: null
    });

    setSelectedSpecialty(null);

    // Recarregar os dados sem filtros
    fetchData();
  }, [router, fetchData]);

  // Carrega favoritos do usuário ao montar
  useEffect(() => {
    if (!user?.uid) return;
    const fetchFavorites = async () => {
      const favs = await getFavorites(user.uid);
      setFavoriteIds(favs);
    };
    fetchFavorites();
  }, [user?.uid]);

  // Função para alternar favorito
  const handleToggleFavorite = async (professionalId: string) => {
    if (!user?.uid) return;
    setFavoriteLoading(true);
    try {
      if (favoriteIds.includes(professionalId)) {
        await removeFavorite(user.uid, professionalId);
        setFavoriteIds((prev) => prev.filter((id) => id !== professionalId));
      } else {
        await addFavorite(user.uid, professionalId);
        setFavoriteIds((prev) => [...prev, professionalId]);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar seus favoritos.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Renderizar um profissional na lista
  const renderProfessional = useCallback(({ item }: { item: Professional }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/professional-profile", params: { id: item.id } })}
        style={{ flex: 1 }}
      >
        <UserAvatar photoURL={item.photoURL} name={item.name} size={64} />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>{Array.isArray(item.specialty) ? item.specialty[0] : item.specialty}</Text>
        <Text style={styles.city}>{item.city}</Text>

        {/* Exibe avaliação se tiver mais de 10 avaliações */}
        {item.showRating && item.averageRating !== undefined ? (
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={14}
                  color={i < Math.floor(item.averageRating!) ? "#FFD700" : "#D1D5DB"}
                  style={styles.starIcon}
                />
              ))}
              {item.averageRating % 1 !== 0 && (
                <Ionicons
                  name="star-half"
                  size={14}
                  color="#FFD700"
                  style={[styles.starIcon, { marginLeft: -14 }]}
                />
              )}
            </View>
            <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
          </View>
        ) : null}

        <View style={styles.recommendationRow}>
          {item.recommendationCount && item.recommendationCount > 0 && (
            <Ionicons name="thumbs-up" size={16} color="#1976D2" />
          )}
          <Text style={styles.recommendationText}>
            {item.recommendationCount === 0 || item.recommendationCount === undefined
              ? "Nenhuma recomendação"
              : item.recommendationCount === 1
                ? "1 recomendação"
                : `${item.recommendationCount} recomendações`}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Botão de favorito no card */}
      <TouchableOpacity
        onPress={() => handleToggleFavorite(item.id)}
        style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}
        disabled={favoriteLoading}
        accessibilityLabel={favoriteIds.includes(item.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <FontAwesome
          name={favoriteIds.includes(item.id) ? "heart" : "heart-o"}
          size={18}
          color={favoriteIds.includes(item.id) ? "#e53935" : "#888"}
        />
      </TouchableOpacity>
    </View>
  ), [router, favoriteIds, favoriteLoading]);

  // Verifica se há filtros ativos
  const hasActiveFilters = activeFilters.minRating !== null ||
    activeFilters.specialties.length > 0 ||
    activeFilters.maxDistance !== null;

  // Renderizar tela de carregamento
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
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.activeFilterButton]}
          onPress={() => router.push('/advanced-filters')}
        >
          <MaterialIcons name="filter-list" size={24} color={hasActiveFilters ? "#FFFFFF" : "#1976D2"} />
        </TouchableOpacity>
      </View>

      {/* Indicador de filtros ativos */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Filtros ativos:
            {activeFilters.minRating !== null && ` ${activeFilters.minRating}+ estrelas`}
            {activeFilters.specialties.length > 0 && ` ${activeFilters.specialties.length} especialidades`}
            {activeFilters.maxDistance !== null && ` ${activeFilters.maxDistance}km`}
          </Text>
          <TouchableOpacity
            onPress={handleClearFilters}
            style={styles.clearFiltersButton}
          >
            <Text style={styles.clearFiltersText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.chipsContainer}>
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

      {filteredProfessionals.length > 0 ? (
        <FlatList
          data={filteredProfessionals}
          renderItem={renderProfessional}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="search-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyStateText}>Nenhum profissional encontrado</Text>
          <Text style={styles.emptyStateSubtext}>Tente ajustar seus filtros ou busca</Text>
        </View>
      )}

      {suggestedFriends.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionTitle}>Sugestões de Amigos</Text>
          <FlatList
            data={suggestedFriends}
            horizontal
            keyExtractor={(item) => item.userId}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "../friend-profile", params: { friendId: item.userId } })}
                style={{ marginHorizontal: 10, alignItems: "center" }}
              >
                <UserAvatar photoURL={item.photoURL} name={item.name} size={60} />
                <Text numberOfLines={1} style={{ maxWidth: 100 }}>{item.name}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    await addFriend(user!.uid, item.userId);
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  activeFilterButton: {
    backgroundColor: "#1976D2",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 6,
  },
  activeFiltersText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "500",
  },
  clearFiltersButton: {
    padding: 4,
  },
  clearFiltersText: {
    color: "#FF3B30",
    fontWeight: "500",
    fontSize: 14,
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
    textAlign: "center",
    marginTop: 8,
  },
  role: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  city: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
    textAlign: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    marginHorizontal: 1,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginLeft: 4,
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
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
});

export default HomeScreen;
