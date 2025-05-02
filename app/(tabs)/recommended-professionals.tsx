import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  Pressable, 
  Platform 
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { removeRecommendation } from "../../services/professionalService";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { db } from "../../services/firebase";

const RecommendedProfessionalsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [professionals, setProfessionals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);

  // Listener em tempo real (igual ao friends.tsx)
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      collection(db, "professionals"),
      (snapshot) => {
        const allProfessionals = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filtra apenas os recomendados pelo usuário
        const recommended = allProfessionals.filter(p => 
          p.recommendedBy?.includes(user.uid)
        );
        
        setProfessionals(recommended);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar profissionais:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Limpeza
  }, [user?.uid]);

  const confirmRemoveRecommendation = (professional) => {
    setSelectedProfessional(professional);
    if (Platform.OS === "web") {
      setModalVisible(true);
    } else {
      Alert.alert(
        "Remover Indicação",
        `Tem certeza que deseja remover sua indicação para ${professional.name}?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Remover", onPress: () => handleRemoveRecommendation(professional.id) }
        ]
      );
    }
  };

  const handleRemoveRecommendation = async (professionalId) => {
    try {
      await removeRecommendation(professionalId, user.uid);
      // Não precisa mais do fetchRecommendedProfessionals() aqui
      // O listener já atualiza automaticamente
    } catch (error) {
      console.error("Erro ao remover indicação:", error);
      Alert.alert("Erro", "Não foi possível remover a indicação");
    } finally {
      setModalVisible(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profissionais que você recomendou</Text>
      {professionals.length === 0 ? (
        <Text>Você ainda não recomendou nenhum profissional.</Text>
      ) : (
        <FlatList
          data={professionals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.professionalContainer}>
              <TouchableOpacity 
                onPress={() => router.push({ pathname: "/professional-profile", params: { id: item.id } })}
                style={styles.professionalItem}
              >
                <View>
                  <Text style={styles.professionalName}>{item.name}</Text>
                  <Text style={styles.professionalInfo}>{item.category} | {item.city}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => confirmRemoveRecommendation(item)}>
                <Text style={styles.removeButtonText}>Remover</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      {/* Modal para confirmação na web */}
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
            <View style={styles.buttonContainer}>
              <Pressable style={[styles.button, styles.buttonCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.textStyle}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonRemove]} onPress={() => handleRemoveRecommendation(selectedProfessional?.id)}>
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
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  loading: { flex: 1, justifyContent: "center" },
  professionalContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: "#ccc" 
  },
  professionalItem: { flex: 1 },
  professionalName: { fontSize: 18, fontWeight: "bold" },
  professionalInfo: { fontSize: 16, color: "#666" },
  removeButton: {
    backgroundColor: "#ffeeee",
    padding: 8,
    borderRadius: 4
  },
  removeButtonText: {
    color: "#ff4444",
    fontWeight: "bold"
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ddd",
    alignItems: "center",
    borderRadius: 5
  },
  backButtonText: { fontSize: 16, fontWeight: "bold" },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalView: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center"
  },
  modalText: { fontSize: 18, marginBottom: 20 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  button: { borderRadius: 5, padding: 10, marginHorizontal: 10 },
  buttonCancel: { backgroundColor: "#cccccc" },
  buttonRemove: { backgroundColor: "#ff4444" },
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" }
});

export default RecommendedProfessionalsScreen;
