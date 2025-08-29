import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Platform, Alert } from 'react-native';
import { collection, query, where, orderBy, startAt, endAt, getDocs } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { addFriend } from '../services/userService';
import UserAvatar from '../components/UserAvatar';

interface UserResult {
  userId: string;
  name?: string;
  email?: string;
  photoURL?: string | null;
}

export default function AddFriendScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      let querySnapshot;
      if (search.includes('@')) {
        const qEmail = query(usersRef, where('email', '==', search.trim()));
        querySnapshot = await getDocs(qEmail);
      } else {
        const qName = query(usersRef, orderBy('name'), startAt(search), endAt(search + '\uf8ff'));
        querySnapshot = await getDocs(qName);
      }
      const users: UserResult[] = querySnapshot.docs.map((doc) => ({ userId: doc.id, ...(doc.data() as any) }));
      const filtered = users.filter((u) => u.userId !== user?.uid);
      setResults(filtered);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showAlert('Erro', 'Não foi possível buscar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;
    try {
      await addFriend(user.uid, friendId);
      showAlert('Sucesso', 'Amigo adicionado com sucesso');
      router.back();
    } catch (error: any) {
      console.error('Erro ao adicionar amigo:', error);
      showAlert('Erro', error.message || 'Não foi possível adicionar o amigo');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Amigo</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <View style={styles.resultItem}>
              <UserAvatar photoURL={item.photoURL} name={item.name} size={40} />
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name || 'Usuário'}</Text>
                <Text style={styles.resultEmail}>{item.email}</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => handleAddFriend(item.userId)}>
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  searchRow: { flexDirection: 'row', marginBottom: 20 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  searchButtonText: { color: '#fff', fontWeight: 'bold' },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultInfo: { flex: 1, marginLeft: 12 },
  resultName: { fontSize: 16, color: '#333', fontWeight: '500' },
  resultEmail: { fontSize: 14, color: '#666' },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#666' },
});

