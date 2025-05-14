import { useRouter } from "expo-router";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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
import { getFriends, removeFriend } from "../../services/userService";

interface Friend {
  id: string;
  name?: string; // Nome pode ser opcional se não carregado ainda
  photoURL?: string | null;
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadFriends = async () => {
      setLoading(true);
      try {
        const friendsList = await getFriends(user.uid);
        setFriends(friendsList);
      } catch (error) {
        console.error("Erro ao carregar amigos:", error);
        showAlert("Erro", "Não foi possível carregar a lista de amigos");
      } finally {
        setLoading(false);
      }
    };

    loadFriends();

    // Listener para atualizações em tempo real (opcional, mas bom para consistência)
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, async (userDoc) => {
      try {
        const friendsIds: string[] = userDoc.data()?.friends || [];
        if (friendsIds.length === friends.length && friends.every(f => friendsIds.includes(f.id))) {
            // Se a lista de IDs não mudou, não precisa refazer a busca completa
            // Apenas atualiza os dados dos amigos já existentes se necessário (ex: nome, photoURL)
            const updatedFriendsDetails = await Promise.all(
                friends.map(async (existingFriend) => {
                    const friendRef = doc(db, "users", existingFriend.id);
                    const friendSnap = await getDoc(friendRef);
                    if (friendSnap.exists()) {
                        return {
                            id: existingFriend.id,
                            name: friendSnap.data()?.name || existingFriend.name || 'Sem nome',
                            photoURL: friendSnap.data()?.photoURL || existingFriend.photoURL
                        };
                    }
                    return existingFriend; // Retorna o amigo existente se não encontrado (improvável)
                })
            );
            setFriends(updatedFriendsDetails as Friend[]);
            return;
        }

        // Se a lista de IDs mudou, recarrega
        const friendsDetails = await Promise.all(
          friendsIds.map(async (id) => {
            const friendRef = doc(db, "users", id);
            const friendSnap = await getDoc(friendRef);
            if (!friendSnap.exists()) {
              console.warn(`Amigo ${id} não encontrado no listener.`);
              return null;
            }
            return {
              id,
              name: friendSnap.data()?.name || "Sem nome",
              photoURL: friendSnap.data()?.photoURL,
            };
          })
        );
        setFriends(friendsDetails.filter(Boolean) as Friend[]);
      } catch (error) {
        console.error("Erro ao atualizar amigos em tempo real:", error);
      }
    });

    return () => unsubscribe();
  }, [user]); // Adicionar friends como dependência pode causar loop, cuidado.

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const confirmRemoval = (friendId: string) => {
    const friendName = friends.find((f) => f.id === friendId)?.name || "este amigo";
    if (Platform.OS === "web") {
      setSelectedFriend(friendId);
      setModalVisible(true);
    } else {
      Alert.alert("Confirmar remoção", `Tem certeza que deseja remover ${friendName}?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", onPress: () => removeFriendHandler(friendId), style: "destructive" },
      ]);
    }
  };

  const removeFriendHandler = async (friendId: string) => {
    if (!user) return;
    setRemovingFriend(friendId);
    try {
      await removeFriend(user.uid, friendId);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      showAlert("Sucesso", "Amigo removido com sucesso");
    } catch (error: any) {
      console.error("Erro ao remover amigo:", error);
      showAlert("Erro", error.message || "Não foi possível remover o amigo");
    } finally {
      setRemovingFriend(null);
      setModalVisible(false);
      setSelectedFriend(null);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Amigos</Text>
      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Você ainda não adicionou amigos.</Text>
          {/* TODO: Adicionar um botão para encontrar/adicionar amigos */}
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/friend-profile", params: { friendId: item.id } })}
              style={styles.friendItemContainer}
            >
              <UserAvatar photoURL={item.photoURL} name={item.name} size={40} />
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name || "Amigo"}</Text>
              </View>
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); confirmRemoval(item.id); }}
                style={[styles.removeButton, removingFriend === item.id && styles.removingButton]}
                disabled={removingFriend === item.id}
              >
                {removingFriend === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.removeText}>Remover</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Tem certeza que deseja remover {friends.find((f) => f.id === selectedFriend)?.name || "este amigo"}?
            </Text>
            <View style={styles.modalButtonContainer}>
              <Pressable style={[styles.modalButton, styles.buttonCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.textStyle}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.buttonRemove]} onPress={() => selectedFriend && removeFriendHandler(selectedFriend)}>
                <Text style={styles.textStyle}>Remover</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333", textAlign: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#666", textAlign: "center" },
  listContent: { paddingBottom: 20 },
  friendItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  friendInfo: { flex: 1, marginLeft: 12 },
  friendName: { fontSize: 16, color: "#333", fontWeight: "500" },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#ffebee", // Um vermelho mais claro para o fundo
  },
  removingButton: { backgroundColor: "#e53935" }, // Vermelho mais escuro quando removendo
  removeText: { color: "#e53935", fontSize: 14, fontWeight: "bold" }, // Texto vermelho
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalView: { margin: 20, backgroundColor: "white", borderRadius: 10, padding: 25, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalText: { marginBottom: 20, textAlign: "center", fontSize: 18 },
  modalButtonContainer: { flexDirection: "row" }, // Removido justifyContent
  modalButton: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, elevation: 2, marginHorizontal: 10, minWidth: 100, alignItems: 'center' }, // Adicionado alignItems
  buttonCancel: { backgroundColor: "#B0BEC5" }, // Cinza mais suave
  buttonRemove: { backgroundColor: "#ef5350" }, // Vermelho mais suave
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" },
});

