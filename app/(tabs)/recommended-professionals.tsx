import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import UserAvatar from "../../components/UserAvatar";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../services/firebase";
import { removeRecommendation } from "../../services/professionalService";
import { getFavorites, getUserProfile } from "../../services/userService";

interface Professional {
  id: string;
  name?: string;
  category?: string;
  city?: string;
  userId?: string;
  photoURL?: string | null;
  type?: "recommended" | "favorite"; // Added to distinguish types
}

const RecommendedProfessionalsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [favoriteProfessionals, setFavoriteProfessionals] = useState<Professional[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [filterType, setFilterType] = useState<"all" | "recommended" | "favorite">("all");

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "professionals"),
      async (snapshot) => {
        const allProfessionals = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Professional, "id">),
        }));

        const recommended = allProfessionals.filter((p) =>
          (p as any).recommendedBy?.includes(user.uid),
        );

        const professionalsWithUserDetails = await Promise.all(
          recommended.map(async (prof) => {
            if (prof.userId) {
              const profUser = await getUserProfile(prof.userId);
              return {
                ...prof,
                photoURL: profUser?.photoURL,
                name: profUser?.name || prof.name,
              };
            }
            return prof;
          }),
        );

        setProfessionals(professionalsWithUserDetails);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar profissionais recomendados:", error);
        Alert.alert("Erro", "Não foi possível carregar os profissionais recomendados.");
        setLoading(false);
      },
    );

    const fetchFavorites = async () => {
      const favoriteIds = await getFavorites(user.uid);
      if (favoriteIds.length > 0) {
        const professionalsRef = collection(db, "professionals");
        const snapshot = await getDocs(professionalsRef);
        const allProfessionals = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Professional, "id">),
        }));
        const favorites = allProfessionals.filter((p) => favoriteIds.includes(p.id));
        setFavoriteProfessionals(favorites);
      } else {
        setFavoriteProfessionals([]);
      }
    };
    fetchFavorites();

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  const confirmRemoveRecommendation = (professional: Professional) => {
    setSelectedProfessional(professional);
    if (Platform.OS === "web") {
      setModalVisible(true);
    } else {
      Alert.alert(
        "Remover indicação",
        `Tem certeza que deseja remover sua indicação para ${professional.name}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            onPress: () => handleRemoveRecommendation(professional.id),
            style: "destructive",
          },
        ],
      );
    }
  };

  const handleRemoveRecommendation = async (professionalId: string) => {
    if (!user?.uid) return;
    try {
      await removeRecommendation(professionalId, user.uid);
      Alert.alert("Sucesso", "Indicação removida.");
    } catch (error) {
      console.error("Erro ao remover indicação:", error);
      Alert.alert("Erro", "Não foi possível remover a indicação.");
    } finally {
      setModalVisible(false);
      setSelectedProfessional(null);
    }
  };

  // Combine professionals and favorites into a single unified list
  const unifiedList = useMemo(() => {
    const recommendedWithType = professionals.map(p => ({ ...p, type: "recommended" as const }));
    const favoritesWithType = favoriteProfessionals.map(p => ({ ...p, type: "favorite" as const }));
    
    // Combine and remove duplicates (if a professional is both recommended and favorite, show as recommended)
    const combined = [...recommendedWithType];
    favoritesWithType.forEach(fav => {
      if (!combined.find(p => p.id === fav.id)) {
        combined.push(fav);
      }
    });
    
    return combined;
  }, [professionals, favoriteProfessionals]);

  // Filter the unified list based on selected filter
  const filteredList = useMemo(() => {
    if (filterType === "all") return unifiedList;
    return unifiedList.filter(p => p.type === filterType);
  }, [unifiedList, filterType]);

  const stats = useMemo(
    () => [
      { label: "Indicações", value: professionals.length },
      { label: "Favoritos", value: favoriteProfessionals.length },
      { label: "Total", value: unifiedList.length },
    ],
    [favoriteProfessionals.length, professionals.length, unifiedList.length],
  );

  const renderEmptyState = (
    title: string,
    description: string,
    action?: () => void,
  ) => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Feather name="users" size={28} color="#4A6572" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      {action && (
        <TouchableOpacity onPress={action} style={styles.emptyActionButton}>
          <Text style={styles.emptyActionButtonText}>Explorar profissionais</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderProfessionalCard = (professional: Professional) => {
    const variant = professional.type || "recommended";
    return (
      <View key={professional.id} style={styles.professionalCard}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/professional-profile", params: { id: professional.id } })}
          style={styles.professionalRow}
        >
          <UserAvatar photoURL={professional.photoURL} name={professional.name} size={56} />
          <View style={styles.professionalDetails}>
            <View style={styles.professionalHeaderRow}>
              <Text style={styles.professionalName}>{professional.name}</Text>
              <View
                style={[
                  styles.badge,
                  variant === "recommended" ? styles.badgeRecommended : styles.badgeFavorite,
                ]}
              >
                <Text style={styles.badgeText}>
                  {variant === "recommended" ? "Indicado" : "Favorito"}
                </Text>
              </View>
            </View>
            <Text style={styles.professionalMeta}>
              {[professional.category, professional.city].filter(Boolean).join(" • ") || "Informações indisponíveis"}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#90A4AE" />
        </TouchableOpacity>
        <View style={styles.professionalFooter}>
          <Text style={styles.professionalHint}>
            {variant === "recommended"
              ? "Sua indicação ajuda outras pessoas a confiarem neste profissional."
              : "Salvo para contato futuro. Toque para ver mais detalhes."}
          </Text>
          {variant === "recommended" ? (
            <TouchableOpacity
              onPress={() => confirmRemoveRecommendation(professional)}
              style={styles.removeButton}
            >
              <Feather name="user-x" size={16} color="#C62828" />
              <Text style={styles.removeButtonText}>Remover indicação</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.favoriteTag}>
              <Feather name="star" size={14} color="#FFB300" />
              <Text style={styles.favoriteTagText}>Acesso rápido</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D3557" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={["#1d3f5d", "#0F2027"]} style={styles.heroContainer}>
        <Text style={styles.heroTitle}>Minhas recomendações</Text>
        <Text style={styles.heroSubtitle}>
          Acompanhe quem você indicou e mantenha seus profissionais favoritos sempre por perto.
        </Text>
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/home")}
          style={styles.heroButton}
        >
          <Feather name="compass" size={16} color="#0F2027" />
          <Text style={styles.heroButtonText}>Descobrir novos profissionais</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus Profissionais</Text>
          <Text style={styles.sectionSubtitle}>
            Profissionais que você indicou e salvou como favoritos, tudo em um só lugar.
          </Text>
        </View>

        {/* Filter buttons */}
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={[styles.filterBtn, filterType === "all" && styles.filterBtnActive]}
            onPress={() => setFilterType("all")}
          >
            <Text style={[styles.filterBtnText, filterType === "all" && styles.filterBtnTextActive]}>
              Todos ({unifiedList.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterType === "recommended" && styles.filterBtnActive]}
            onPress={() => setFilterType("recommended")}
          >
            <Text style={[styles.filterBtnText, filterType === "recommended" && styles.filterBtnTextActive]}>
              Indicados ({professionals.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterType === "favorite" && styles.filterBtnActive]}
            onPress={() => setFilterType("favorite")}
          >
            <Text style={[styles.filterBtnText, filterType === "favorite" && styles.filterBtnTextActive]}>
              Favoritos ({favoriteProfessionals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {filteredList.length === 0
          ? renderEmptyState(
              filterType === "all"
                ? "Nenhum profissional por aqui"
                : filterType === "recommended"
                ? "Nenhuma indicação por aqui"
                : "Você ainda não tem favoritos",
              filterType === "all"
                ? "Quando você indicar ou favoritar alguém, ele aparecerá aqui."
                : filterType === "recommended"
                ? "Quando você recomendar alguém, ele aparecerá nesta lista."
                : "Salve profissionais para encontrá-los rapidamente quando precisar.",
              () => router.push("/(tabs)/home"),
            )
          : filteredList.map((professional) => renderProfessionalCard(professional))}
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Remover indicação</Text>
            <Text style={styles.modalText}>
              Tem certeza que deseja remover sua indicação para {selectedProfessional?.name}?
            </Text>
            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.modalButton, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.buttonRemove]}
                onPress={() => selectedProfessional && handleRemoveRecommendation(selectedProfessional.id)}
              >
                <Text style={styles.textStyle}>Remover</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    backgroundColor: "#F4F6F8",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
  },
  heroContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#E0E6ED",
    marginTop: 8,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 13,
    color: "#E0E6ED",
    marginTop: 4,
    letterSpacing: 0.4,
  },
  heroButton: {
    marginTop: 24,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F2027",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#263238",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#607D8B",
    marginTop: 4,
    lineHeight: 20,
  },
  filterButtonsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E6ED",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterBtnActive: {
    backgroundColor: "#1d3f5d",
    borderColor: "#1d3f5d",
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#607D8B",
  },
  filterBtnTextActive: {
    color: "#FFFFFF",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ECEFF1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#37474F",
  },
  emptyText: {
    fontSize: 14,
    color: "#607D8B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  emptyActionButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#1D3557",
  },
  emptyActionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  professionalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  professionalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  professionalDetails: {
    flex: 1,
  },
  professionalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  professionalName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B1F32",
  },
  professionalMeta: {
    marginTop: 6,
    fontSize: 14,
    color: "#607D8B",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeRecommended: {
    backgroundColor: "#E3F2FD",
  },
  badgeFavorite: {
    backgroundColor: "#FFF8E1",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D3557",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  professionalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  professionalHint: {
    flex: 1,
    fontSize: 12,
    color: "#78909C",
    marginRight: 12,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFEBEE",
    gap: 6,
  },
  removeButtonText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 13,
  },
  favoriteTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  favoriteTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B26A00",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(13, 28, 49, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalView: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B1F32",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: "#455A64",
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  buttonCancel: {
    backgroundColor: "#ECEFF1",
  },
  buttonCancelText: {
    color: "#455A64",
    fontWeight: "600",
  },
  buttonRemove: {
    backgroundColor: "#C62828",
  },
  textStyle: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

export default RecommendedProfessionalsScreen;
