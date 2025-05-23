import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileHeader}>
          <UserAvatar
            photoURL={professionalUser?.photoURL}
            name={professionalName}
            size={120}
          />
          <Text style={styles.name}>{professionalName}</Text>
          
          {/* Botão de Favoritar */}
          {user && user.uid !== professional.userId && (
            <TouchableOpacity onPress={handleToggleFavorite} style={{ marginTop: 8, alignSelf: 'center' }}>
              <FontAwesome
                name={isFavorited ? "heart" : "heart-o"}
                size={32}
                color={isFavorited ? "#e53935" : "#888"}
              />
              <Text style={{ color: isFavorited ? "#e53935" : "#888", fontSize: 12, textAlign: 'center' }}>
                {isFavorited ? "Favorito" : "Favoritar"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Componente de Avaliação */}
          {user && user.uid !== professional.userId && (
            <RatingComponent
              professionalId={id.toString()}
              showRating={ratingStats.showRating}
              averageRating={ratingStats.averageRating}
              totalRatings={ratingStats.totalRatings}
              onRatingSubmitted={handleRatingSubmitted}
              size="large"
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={24} color="#4F4F4F" style={styles.icon} />
            <Text style={styles.infoLabel}>Telefone:</Text>
            {professionalPhone ? (
              <TouchableOpacity onPress={handleCall}>
                <Text style={[styles.infoValue, styles.linkText]}>{professionalPhone}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.infoValue}>Não informado</Text>
            )}
          </View>
        </View>

        {user && user.uid === professional.userId && (
          <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEditProfile}>
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.buttonText}>Editar Meu Perfil Profissional</Text>
          </TouchableOpacity>
        )}

        {user && user.uid !== professional.userId && !isRecommended && (
          <TouchableOpacity style={[styles.button, styles.recommendButton]} onPress={handleAddRecommendation}>
            <FontAwesome name="thumbs-up" size={20} color="white" />
            <Text style={styles.buttonText}>Recomendar Este Profissional</Text>
          </TouchableOpacity>
        )}

        {user && user.uid !== professional.userId && isRecommended && (
          <TouchableOpacity style={[styles.button, styles.removeButton]} onPress={handleRemoveRecommendation}>
            <FontAwesome name="thumbs-down" size={20} color="white" />
            <Text style={styles.buttonText}>Remover Indicação</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes do Profissional</Text>

          <View style={styles.infoRowVertical}>
            <View style={styles.infoRowHeader}>
              <MaterialIcons name="star" size={24} color="#4F4F4F" style={styles.icon} />
              <Text style={styles.infoLabel}>Especialidades:</Text>
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

          <View style={styles.infoRow}>
            <MaterialIcons name="location-city" size={24} color="#4F4F4F" style={styles.icon} />
            <Text style={styles.infoLabel}>Atende em:</Text>
            <Text style={styles.infoValue}>{professional.city || "Não informada"}</Text>
          </View>

          <View style={styles.infoRowVertical}>
            <View style={styles.infoRowHeader}>
              <MaterialIcons name="info-outline" size={24} color="#4F4F4F" style={styles.icon} />
              <Text style={styles.infoLabel}>Sobre mim:</Text>
            </View>
            <Text style={[styles.infoValue, styles.bioText]}>
              {professional.bio || "Nenhuma descrição adicional fornecida."}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recomendações</Text>
          <View style={styles.infoRow}>
            <FontAwesome name="thumbs-up" size={24} color="#1976D2" style={styles.icon} />
            <Text style={styles.infoLabel}>Total de Recomendações:</Text>
            <Text style={styles.infoValue}>{recommendationCount}</Text>
          </View>

          {/* Lista de quem recomendou - agora em lista vertical */}
          {recommenders.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.infoLabel, { marginBottom: 8 }]}>Quem recomendou:</Text>
              {recommenders.map((item) => (
                <TouchableOpacity
                  key={item.userId || item.id}
                  onPress={() => router.push({ pathname: "../friend-profile", params: { friendId: item.userId || item.id } })}
                  style={styles.recommenderRow}
                >
                  <UserAvatar photoURL={item.photoURL} name={item.name} size={40} />
                  <Text style={styles.recommenderName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.infoValue}>Ainda não há recomendações.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 15,
    color: "#1d3f5d",
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
    color: "#1d3f5d", // Cor de destaque para títulos de seção
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoRowVertical: {
    marginBottom: 15,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginRight: 8,
  },
  infoValue: {
    fontSize: 16,
    color: "#1C1C1E",
    flexShrink: 1, // Para quebrar linha se necessário
  },
  linkText: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  bioText: {
    lineHeight: 24, // Melhorar legibilidade para textos longos
    textAlign: 'justify',
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  specialtyTag: {
    backgroundColor: "#1d3f5d", // updated to primary blue
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: "#FFFFFF", // white text for contrast
    fontSize: 14,
    fontWeight: "500",
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
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: "#007AFF",
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
