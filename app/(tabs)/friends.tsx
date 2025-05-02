import { useRouter } from 'expo-router'; // Adicione esta linha
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { getFriends, removeFriend } from '../../services/userService';

interface Friend {
  id: string;
  name: string;
  photoURL?: string;
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const router = useRouter(); // Adicione esta linha
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  // Carrega os amigos
  useEffect(() => {
    if (!user) return;

    const loadFriends = async () => {
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

    // Listener para atualizações em tempo real
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, async (userDoc) => {
      try {
        const friendsIds: string[] = userDoc.data()?.friends || [];
        
        const friendsDetails = await Promise.all(
          friendsIds.map(async (id) => {
            const existingFriend = friends.find(f => f.id === id);
            if (existingFriend) return existingFriend;
            
            const friendRef = doc(db, "users", id);
            const friendSnap = await getDoc(friendRef);
            
            if (!friendSnap.exists()) {
              console.warn(`Amigo ${id} não encontrado`);
              return null;
            }
            
            return {
              id,
              name: friendSnap.data()?.name || 'Sem nome',
              photoURL: friendSnap.data()?.photoURL
            };
          })
        );
        
        setFriends(friendsDetails.filter(Boolean) as Friend[]);
      } catch (error) {
        console.error("Erro ao atualizar amigos:", error);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Alert universal para todas as plataformas
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Confirmação de remoção
  const confirmRemoval = (friendId: string) => {
    if (Platform.OS === 'web') {
      setSelectedFriend(friendId);
      setModalVisible(true);
    } else {
      Alert.alert(
        "Confirmar remoção",
        `Tem certeza que deseja remover ${friends.find(f => f.id === friendId)?.name}?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Remover", onPress: () => removeFriendHandler(friendId) }
        ]
      );
    }
  };

  // Lógica de remoção
  const removeFriendHandler = async (friendId: string) => {
    if (!user) return;

    try {
      setRemovingFriend(friendId);
      await removeFriend(user.uid, friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
      showAlert("Sucesso", "Amigo removido com sucesso");
    } catch (error) {
      console.error("Erro ao remover amigo:", error);
      showAlert("Erro", error.message || "Não foi possível remover o amigo");
    } finally {
      setRemovingFriend(null);
      setModalVisible(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Amigos</Text>
      
      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Você ainda não adicionou amigos.</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/friend-profile',
                params: { friendId: item.id }
              })}
              style={styles.friendItemContainer}
            >
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name}</Text>
              </View>
              
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation(); // Isso evita que o TouchableOpacity pai seja acionado
                  confirmRemoval(item.id);
                }}
                style={[
                  styles.removeButton,
                  removingFriend === item.id && styles.removingButton
                ]}
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

      {/* Modal para confirmação na web */}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Tem certeza que deseja remover {friends.find(f => f.id === selectedFriend)?.name}?
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonRemove]}
                onPress={() => removeFriendHandler(selectedFriend!)}
              >
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
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  listContent: {
    paddingBottom: 20
  },
  friendItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2, // para Android
    // Para Web (React Native Web)
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)'
    })
  },
  friendInfo: {
    flex: 1
  },
  friendName: {
    fontSize: 16,
    color: '#333'
  },
  removeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#ffeeee',
    minWidth: 80,
    alignItems: 'center'
  },
  removingButton: {
    backgroundColor: '#ff4444'
  },
  removeText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500'
  },
  // Estilos para o modal (web)
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 18
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    marginHorizontal: 10,
    minWidth: 100
  },
  buttonCancel: {
    backgroundColor: '#cccccc'
  },
  buttonRemove: {
    backgroundColor: '#ff4444'
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  }
});


