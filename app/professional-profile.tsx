import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RatingComponent from "../components/RatingComponent";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../hooks/useAuth";
import {
  getProfessionalById,
  recommendProfessional,
  removeRecommendation,
} from "../services/professionalService";
import { getProfessionalRatingStats } from "../services/ratingService";
import { addFavorite, getFavorites, getUserProfile, removeFavorite, sendRecommendationNotification } from "../services/userService";

const ProfessionalProfileScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [professional, setProfessional] = useState<any>(null);
  const [professionalUser, setProfessionalUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRecommended, setIsRecommended] = useState(false);
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [recommenders, setRecommenders] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<{
    totalRatings: number;
    averageRating: number;
    showRating: boolean;
  }>({
    totalRatings: 0,
    averageRating: 0,
    showRating: false
  });
  const [isFavorited, setIsFavorited] = useState(false);

  const fetchProfessionalProfile = async () => {
    setLoading(true);
    try {
      if (!id) return;
      const professionalData = await getProfessionalById(id.toString());
      setProfessional(professionalData);
      setRecommendationCount(professionalData?.recommendationCount || 0);

      if (professionalData && professionalData.userId) {
        const profUserData = await getUserProfile(professionalData.userId);
        setProfessionalUser(profUserData);
      }

      const recommendedBy = professionalData?.recommendedBy || [];
      const userHasRecommended = user ? recommendedBy.includes(user.uid) : false;
      setIsRecommended(userHasRecommended);

      // Buscar estatísticas de avaliação
      try {
        const stats = await getProfessionalRatingStats(id.toString());
        setRatingStats(stats);
      } catch (error) {
        console.error("Erro ao buscar estatísticas de avaliação:", error);
      }

      // Buscar perfis de quem recomendou
      if (recommendedBy.length > 0) {
        const recommendersData = await Promise.all(
          recommendedBy.map(async (uid: string) => {
            const profile = await getUserProfile(uid);
            return profile ? { ...profile, userId: uid } : null;
          })
        );
        setRecommenders(recommendersData.filter(Boolean));
      } else {
        setRecommenders([]);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil do profissional:", error);
      Alert.alert("Erro", "Não foi possível carregar o perfil do profissional.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionalProfile();
    // Verifica se o profissional está nos favoritos do usuário
    const checkFavorite = async () => {
      if (user && id) {
        const favorites = await getFavorites(user.uid);
        setIsFavorited(favorites.includes(id.toString()));
      }
    };
    checkFavorite();
  }, [id, user]);

  const handleEditProfile = () => {
    router.push(`/edit-professional-profile?id=${id}`);
  };

  const handleAddRecommendation = async () => {
    if (!professional || !user) return;
    try {
      await recommendProfessional(id.toString(), user.uid);
      // Notifica o profissional recomendado
      if (professional.userId) {
        await sendRecommendationNotification({
          toUserId: professional.userId,
          fromUserId: user.uid,
          professionalId: id.toString(),
        });
      }
      Alert.alert("Sucesso", "Recomendação adicionada!");
      setIsRecommended(true);
      setRecommendationCount(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao adicionar recomendação:", error);
      Alert.alert("Erro", "Não foi possível adicionar a recomendação.");
    }
  };

  const handleRemoveRecommendation = async () => {
    if (!professional || !user) return;
    Alert.alert(
      "Confirmar remoção",
      `Tem certeza que deseja remover sua indicação de ${professionalUser?.name || professional?.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          onPress: async () => {
            try {
              await removeRecommendation(id.toString(), user.uid);
              Alert.alert("Sucesso", "Indicação removida!");
              setIsRecommended(false);
              setRecommendationCount(prev => Math.max(0, prev - 1));
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

  const handleCall = () => {
    const phoneNumber = professional?.phone || professionalUser?.phone;
    if (phoneNumber) {
      let RphoneNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits
      if (Platform.OS === 'android') {
        RphoneNumber = `tel:${RphoneNumber}`;
      } else {
        RphoneNumber = `telprompt:${RphoneNumber}`;
      }
      Linking.canOpenURL(RphoneNumber)
        .then(supported => {
          if (!supported) {
            Alert.alert('Erro', 'Não é possível realizar chamadas neste dispositivo.');
          } else {
            return Linking.openURL(RphoneNumber);
          }
        })
        .catch(err => console.error('Erro ao tentar abrir URL de chamada:', err));
    } else {
      Alert.alert("Informação", "Número de telefone não disponível.");
    }
  };

  const handleRatingSubmitted = () => {
    // Recarregar as estatísticas de avaliação após uma nova avaliação
    if (id) {
      getProfessionalRatingStats(id.toString())
        .then(stats => {
          setRatingStats(stats);
        })
        .catch(error => {
          console.error("Erro ao atualizar estatísticas de avaliação:", error);
        });
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !id) return;
    try {
      if (isFavorited) {
        await removeFavorite(user.uid, id.toString());
        setIsFavorited(false);
      } else {
        await addFavorite(user.uid, id.toString());
        setIsFavorited(true);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar seus favoritos.");
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  if (!professional) {
    return <View style={styles.centered}><Text>Profissional não encontrado.</Text></View>;
  }

  const professionalName = professionalUser?.name || professional.name || "Nome não disponível";
  const professionalPhone = professional?.phone || professionalUser?.phone;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Gradient Header */}
        <LinearGradient colors={["#1d3f5d", "#0F2027"]} style={styles.headerBackground}>
          <View style={styles.profileHeader}>
            <UserAvatar
              photoURL={professionalUser?.photoURL}
              name={professionalName}
              size={100}
            />
            <Text style={styles.name}>{professionalName}</Text>
            
            {/* Favoritar e Avaliação em linha */}
            <View style={styles.headerActions}>
              {user && user.uid !== professional.userId && (
                <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                  <FontAwesome
                    name={isFavorited ? "heart" : "heart-o"}
                    size={20}
                    color={isFavorited ? "#FFB300" : "#FFFFFF"}
                  />
                  <Text style={styles.favoriteText}>
                    {isFavorited ? "Favoritado" : "Favoritar"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Rating Component */}
          {user && user.uid !== professional.userId && (
            <View style={styles.ratingSection}>
              <RatingComponent
                professionalId={id.toString()}
                showRating={ratingStats.showRating}
                averageRating={ratingStats.averageRating}
                totalRatings={ratingStats.totalRatings}
                onRatingSubmitted={handleRatingSubmitted}
                size="large"
              />
            </View>
          )}

          {/* Phone Section */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={24} color="#1d3f5d" style={styles.icon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Telefone</Text>
                {professionalPhone ? (
                  <TouchableOpacity onPress={handleCall}>
                    <Text style={[styles.infoValue, styles.linkText]}>{professionalPhone}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoValue}>Não informado</Text>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {user && user.uid === professional.userId && (
            <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEditProfile}>
              <MaterialIcons name="edit" size={20} color="white" />
              <Text style={styles.buttonText}>Editar Perfil</Text>
            </TouchableOpacity>
          )}

          {user && user.uid !== professional.userId && !isRecommended && (
            <TouchableOpacity style={[styles.button, styles.recommendButton]} onPress={handleAddRecommendation}>
              <FontAwesome name="thumbs-up" size={18} color="white" />
              <Text style={styles.buttonText}>Recomendar</Text>
            </TouchableOpacity>
          )}

          {user && user.uid !== professional.userId && isRecommended && (
            <TouchableOpacity style={[styles.button, styles.removeButton]} onPress={handleRemoveRecommendation}>
              <FontAwesome name="thumbs-down" size={18} color="white" />
              <Text style={styles.buttonText}>Remover Indicação</Text>
            </TouchableOpacity>
          )}

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes Profissionais</Text>

            {/* Specialties */}
            <View style={styles.infoRowVertical}>
              <View style={styles.infoRowHeader}>
                <MaterialIcons name="star" size={22} color="#1d3f5d" style={styles.icon} />
                <Text style={styles.infoLabel}>Especialidades</Text>
              </View>
              {professional.specialties && professional.specialties.length > 0 ? (
                <View style={styles.specialtiesContainer}>
                  {professional.specialties.map((spec: string, index: number) => (
                    <View key={index} style={styles.specialtyTag}>
                      <Text style={styles.specialtyText}>{spec}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoValue}>Não informadas</Text>
              )}
            </View>

            {/* City */}
            <View style={styles.infoRow}>
              <MaterialIcons name="location-city" size={22} color="#1d3f5d" style={styles.icon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Atende em</Text>
                <Text style={styles.infoValue}>{professional.city || "Não informada"}</Text>
              </View>
            </View>

            {/* Bio */}
            <View style={styles.infoRowVertical}>
              <View style={styles.infoRowHeader}>
                <MaterialIcons name="info-outline" size={22} color="#1d3f5d" style={styles.icon} />
                <Text style={styles.infoLabel}>Sobre</Text>
              </View>
              <Text style={[styles.infoValue, styles.bioText]}>
                {professional.bio || "Nenhuma descrição fornecida."}
              </Text>
            </View>
          </View>

          {/* Recommendations Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendações</Text>
            <View style={styles.recommendationStats}>
              <FontAwesome name="thumbs-up" size={20} color="#1d3f5d" />
              <Text style={styles.recommendationCount}>{recommendationCount} recomendações</Text>
            </View>

            {recommenders.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.recommendersLabel}>Quem recomendou:</Text>
                {recommenders.map((item) => (
                  <TouchableOpacity
                    key={item.userId || item.id}
                    onPress={() => router.push({ pathname: "../friend-profile", params: { friendId: item.userId || item.id } })}
                    style={styles.recommenderRow}
                  >
                    <UserAvatar photoURL={item.photoURL} name={item.name} size={44} />
                    <Text style={styles.recommenderName}>{item.name}</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#90A4AE" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  headerBackground: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileHeader: {
    alignItems: "center",
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  favoriteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E6ED",
  },
  infoCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  section: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E6ED",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoRowVertical: {
    marginBottom: 16,
  },
  infoRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#607D8B",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#263238",
    lineHeight: 22,
  },
  linkText: {
    color: "#1d3f5d",
    fontWeight: "600",
  },
  bioText: {
    lineHeight: 24,
    textAlign: "left",
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  specialtyTag: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: "#1d3f5d",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  editButton: {
    backgroundColor: "#1d3f5d",
  },
  recommendButton: {
    backgroundColor: "#4CAF50",
  },
  removeButton: {
    backgroundColor: "#DC3545",
  },
  recommendationStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  recommendationCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#263238",
  },
  recommendersLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#607D8B",
    marginBottom: 12,
  },
  recommenderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  recommenderName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#263238",
  },
});
  },
  recommendButton: {
    backgroundColor: "#28A745", // Verde para recomendar
  },
  removeButton: {
    backgroundColor: "#DC3545", // Vermelho para remover
  },
  recommenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  recommenderName: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1d3f5d',
    fontWeight: '600',
  },
});

export default ProfessionalProfileScreen;
