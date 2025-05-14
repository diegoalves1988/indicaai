import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import UserAvatar from "../../components/UserAvatar"; // Importar UserAvatar
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../services/firebase";
import { removeRecommendation } from "../../services/professionalService";
import { getUserProfile } from "../../services/userService"; // Importar para buscar dados do usuário

interface Professional {
  id: string;
  name?: string;
  category?: string;
  city?: string;
  userId?: string; // Para buscar photoURL e nome do usuário
  photoURL?: string | null; // Para armazenar photoURL diretamente
  // Outros campos conforme necessário
}

const RecommendedProfessionalsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

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
          p.recommendedBy?.includes(user.uid)
        );

        // Buscar detalhes do usuário para cada profissional recomendado
        const professionalsWithUserDetails = await Promise.all(
          recommended.map(async (prof) => {
            if (prof.userId) {
              const profUser = await getUserProfile(prof.userId);
              return { 
                ...prof, 
                photoURL: profUser?.photoURL, 
                name: profUser?.name || prof.name // Prioriza nome do perfil de usuário
              };
            }
            return prof;
          })
        );

        setProfessionals(professionalsWithUserDetails);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar profissionais recomendados:", error);
        Alert.alert("Erro", "Não foi possível carregar os profissionais recomendados.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const confirmRemoveRecommendation = (professional: Professional) => {
    setSelectedProfessional(professional);
    if (Platform.OS === "web") {
      setModalVisible(true);
    } else {
      Alert.alert(
        "Remover Indicação",
        `Tem certeza que deseja remover sua indicação para ${professional.name}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            onPress: () => handleRemoveRecommendation(professional.id),
            style: "destructive",
          },
        ]
      );
    }
  };

  const handleRemoveRecommendation = async (professionalId: string) => {
    if (!user?.uid) return;
    try {
      await removeRecommendation(professionalId, user.uid);
      // O listener onSnapshot cuidará de atualizar a lista
      Alert.alert("Sucesso", "Indicação removida.");
    } catch (error) {
      console.error("Erro ao remover indicação:", error);
      Alert.alert("Erro", "Não foi possível remover a indicação.");
    } finally {
      setModalVisible(false);
      setSelectedProfessional(null);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profissionais que você recomendou</Text>
      {professionals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Você ainda não recomendou nenhum profissional.</Text>
        </View>
      ) : (
        <FlatList
          data={professionals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.professionalItemContainer}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/professional-profile", params: { id: item.id } })}
                style={styles.professionalDetailsTouchable}
              >
                <UserAvatar photoURL={item.photoURL} name={item.name} size={50} />
                <View style={styles.professionalInfoContainer}>
                  <Text style={styles.professionalName}>{item.name}</Text>
                  <Text style={styles.professionalInfoText}>{item.category} | {item.city}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => confirmRemoveRecommendation(item)}
              >
                <Text style={styles.removeButtonText}>Remover</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      {/* Botão Voltar pode ser desnecessário se a navegação por abas/stack estiver clara */}
      {/* <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity> */}

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Tem certeza que deseja remover sua indicação para {selectedProfessional?.name}?
            </Text>
            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.modalButton, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancelar</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8F9FA" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333", textAlign: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  emptyText: { fontSize: 16, color: "#666", textAlign: "center" },
  listContent: { paddingBottom: 20 },
  professionalItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  professionalDetailsTouchable: { flexDirection: "row", alignItems: "center", flex: 1 },
  professionalInfoContainer: { marginLeft: 12, flex: 1 },
  professionalName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  professionalInfoText: { fontSize: 14, color: "#666", marginTop: 2 },
  removeButton: { backgroundColor: "#FFEBEE", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  removeButtonText: { color: "#D32F2F", fontWeight: "bold", fontSize: 13 },
  modalView: { margin: 20, backgroundColor: "white", borderRadius: 10, padding: 25, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalText: { marginBottom: 20, textAlign: "center", fontSize: 18 },
  modalButtonContainer: { flexDirection: "row" },
  modalButton: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, elevation: 2, marginHorizontal: 10, minWidth: 100, alignItems: "center" },
  buttonCancel: { backgroundColor: "#B0BEC5" },
  buttonRemove: { backgroundColor: "#EF5350" },
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" },
});

export default RecommendedProfessionalsScreen;

