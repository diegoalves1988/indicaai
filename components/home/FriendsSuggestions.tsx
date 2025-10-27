import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import UserAvatar from '../UserAvatar';

interface SuggestedFriend {
  userId: string;
  name?: string;
  photoURL?: string | null;
}

interface FriendsSuggestionsProps {
  friends: SuggestedFriend[];
  onAddFriend: (id: string) => void;
}

const FriendsSuggestions: React.FC<FriendsSuggestionsProps> = ({ friends, onAddFriend }) => {
  const router = useRouter();

  if (friends.length === 0) return null;

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.title}>Sugestões de Amigos</Text>
      <FlatList
        data={friends}
        horizontal
        keyExtractor={(item) => item.userId}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/friend-profile', params: { friendId: item.userId } })}
            style={styles.itemContainer}
          >
            <UserAvatar photoURL={item.photoURL} name={item.name} size={60} />
            <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
            <TouchableOpacity
              onPress={() => onAddFriend(item.userId)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    marginLeft: 16,
    color: '#1C1C1E',
  },
  itemContainer: {
    marginHorizontal: 10,
    alignItems: 'center',
  },
  name: {
    maxWidth: 100,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default FriendsSuggestions;
