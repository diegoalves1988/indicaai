import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';

import HomeHeader from '../../components/home/HomeHeader';
import ProfessionalList from '../../components/home/ProfessionalList';
import FriendsSuggestions from '../../components/home/FriendsSuggestions';
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
  const params = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);
  const [lastSuggestedId, setLastSuggestedId] = useState<string | null>(null);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(false);
  const [loadingMoreSuggestions, setLoadingMoreSuggestions] = useState(false);

  const SUGGESTIONS_PAGE_SIZE = 10;

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
    loadMoreProfessionals,
    hasMore,
    loadingMore,
    userCity,
    userState,
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

  // Apply filters from URL params (coming back from advanced-filters)
  useEffect(() => {
    if (params.applied) {
      setActiveFilters({
        minRating: params.minRating ? Number(params.minRating) : null,
        specialties: params.specialties ? String(params.specialties).split(',') : [],
        maxDistance: params.maxDistance !== undefined && params.maxDistance !== '' ? Number(params.maxDistance) : null,
      });
    }
  }, [params.applied, params.minRating, params.specialties, params.maxDistance]);

  useEffect(() => {
    const loadUser = async () => {
      if (!user) return;
      const profile = await getUserProfile(user.uid);
      setUserData(profile);
      const suggestions = await getSuggestedFriends(user.uid, SUGGESTIONS_PAGE_SIZE);
      setSuggestedFriends(suggestions);
      setLastSuggestedId(
        suggestions.length > 0 ? suggestions[suggestions.length - 1].userId : null
      );
      setHasMoreSuggestions(suggestions.length === SUGGESTIONS_PAGE_SIZE);
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
    const updated = await getSuggestedFriends(user.uid, SUGGESTIONS_PAGE_SIZE);
    setSuggestedFriends(updated);
    setLastSuggestedId(
      updated.length > 0 ? updated[updated.length - 1].userId : null
    );
    setHasMoreSuggestions(updated.length === SUGGESTIONS_PAGE_SIZE);
    Alert.alert('Amigo adicionado!', 'Vocês agora estão conectados.');
  };

  const handleClearFilters = () => {
    clearFilters();
    setSelectedSpecialty(null);
  };

  const handlePressProfessional = (id: string) => {
    router.push({ pathname: '/professional-profile', params: { id } });
  };

  const getSectionTitle = () => {
    if (activeFilters.maxDistance === 0 && userCity) return `Profissionais em ${userCity}`;
    if (userCity) return `Profissionais perto de ${userCity}`;
    return 'Profissionais em destaque';
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
      loadMoreProfessionals();
    }
  };

  const loadMoreSuggestedFriends = async () => {
    if (!user || loadingMoreSuggestions || !hasMoreSuggestions) return;
    setLoadingMoreSuggestions(true);
    const more = await getSuggestedFriends(
      user.uid,
      SUGGESTIONS_PAGE_SIZE,
      lastSuggestedId || undefined
    );
    setSuggestedFriends((prev) => [...prev, ...more]);
    setLastSuggestedId(
      more.length > 0 ? more[more.length - 1].userId : lastSuggestedId
    );
    if (more.length < SUGGESTIONS_PAGE_SIZE) {
      setHasMoreSuggestions(false);
    }
    setLoadingMoreSuggestions(false);
  };

  if (authLoading || loadingData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrapper}
      contentContainerStyle={{ paddingBottom: 40 }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <HomeHeader
        userName={userData?.name}
        photoURL={userData?.photoURL}
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        hasActiveFilters={hasActiveFilters}
        activeFilters={activeFilters}
        onPressFilters={() => {
          const filterParams: Record<string, string> = {};
          if (activeFilters.minRating !== null) filterParams.minRating = String(activeFilters.minRating);
          if (activeFilters.specialties.length > 0) filterParams.specialties = activeFilters.specialties.join(',');
          if (activeFilters.maxDistance !== null) filterParams.maxDistance = String(activeFilters.maxDistance);
          if (userCity) filterParams.userCity = userCity;
          if (userState) filterParams.userState = userState;
          router.push({ pathname: '/advanced-filters', params: filterParams });
        }}
        onClearFilters={handleClearFilters}
        topSpecialties={topSpecialties}
        selectedSpecialty={selectedSpecialty}
        onSelectSpecialty={setSelectedSpecialty}
        onSignOut={async () => { await signOut(auth); }}
      />

      <Text style={styles.sectionTitle}>{getSectionTitle()}</Text>
      <ProfessionalList
        professionals={professionals}
        favoriteIds={favoriteIds}
        favoriteLoading={favoriteLoading}
        onToggleFavorite={toggleFavorite}
        onPressProfessional={handlePressProfessional}
      />

      {hasMore && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMoreProfessionals}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.loadMoreText}>Carregar mais</Text>
          )}
        </TouchableOpacity>
      )}

      <FriendsSuggestions friends={suggestedFriends} onAddFriend={handleAddFriend} />
      {hasMoreSuggestions && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMoreSuggestedFriends}
          disabled={loadingMoreSuggestions}
        >
          {loadingMoreSuggestions ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.loadMoreText}>Carregar mais sugestões</Text>
          )}
        </TouchableOpacity>
      )}

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
  loadMoreButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1d3f5d',
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#1d3f5d',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
