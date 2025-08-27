import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';

import HomeHeader from './home/HomeHeader';
import ProfessionalList from './home/ProfessionalList';
import FriendsSuggestions from './home/FriendsSuggestions';
import { useProfessionals } from '../../hooks/useProfessionals';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../services/firebase';
import { addFriend, getSuggestedFriends, getUserProfile } from '../../services/userService';

interface SuggestedFriend {
  userId: string;
  name?: string;
  photoURL?: string | null;
}

const HomeScreen = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);

  const {
    professionals,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    clearFilters,
    topSpecialties,
    favoriteIds,
    favoriteLoading,
    toggleFavorite,
    loadingData,
  } = useProfessionals();

  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const hasActiveFilters =
    activeFilters.minRating !== null ||
    activeFilters.specialties.length > 0 ||
    activeFilters.maxDistance !== null;

  useEffect(() => {
    if (!user && !authLoading) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadUser = async () => {
      if (!user) return;
      const profile = await getUserProfile(user.uid);
      setUserData(profile);
      const suggestions = await getSuggestedFriends(user.uid);
      setSuggestedFriends(suggestions);
    };
    loadUser();
  }, [user]);

  useEffect(() => {
    if (selectedSpecialty) {
      setActiveFilters({ ...activeFilters, specialties: [selectedSpecialty] });
    } else if (activeFilters.specialties.length > 0) {
      setActiveFilters({ ...activeFilters, specialties: [] });
    }
  }, [selectedSpecialty]);

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;
    await addFriend(user.uid, friendId);
    const updated = await getSuggestedFriends(user.uid);
    setSuggestedFriends(updated);
    Alert.alert('Amigo adicionado!', 'Vocês agora estão conectados.');
  };

  const handleClearFilters = () => {
    clearFilters();
    setSelectedSpecialty(null);
  };

  const handlePressProfessional = (id: string) => {
    router.push({ pathname: '/professional-profile', params: { id } });
  };

  if (authLoading || loadingData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={{ paddingBottom: 40 }}>
      <HomeHeader
        userName={userData?.name}
        photoURL={userData?.photoURL}
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        hasActiveFilters={hasActiveFilters}
        activeFilters={activeFilters}
        onPressFilters={() => router.push('/advanced-filters')}
        onClearFilters={handleClearFilters}
        topSpecialties={topSpecialties}
        selectedSpecialty={selectedSpecialty}
        onSelectSpecialty={setSelectedSpecialty}
        onSignOut={async () => { await signOut(auth); }}
      />

      <Text style={styles.sectionTitle}>Profissionais em destaque</Text>
      <ProfessionalList
        professionals={professionals}
        favoriteIds={favoriteIds}
        favoriteLoading={favoriteLoading}
        onToggleFavorite={toggleFavorite}
        onPressProfessional={handlePressProfessional}
      />

      <FriendsSuggestions friends={suggestedFriends} onAddFriend={handleAddFriend} />

      {!userData?.professionalProfile && (
        <TouchableOpacity
          style={styles.beProfessionalButton}
          onPress={() => router.push('/register-professional')}
        >
          <Text style={styles.beProfessionalText}>Quero ser profissional</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    marginLeft: 16,
    color: '#1C1C1E',
  },
  beProfessionalButton: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderColor: '#1d3f5d',
    borderWidth: 1,
    alignItems: 'center',
  },
  beProfessionalText: {
    color: '#1d3f5d',
    fontWeight: 'bold',
    borderRadius: 18,
  },
});

export default HomeScreen;
