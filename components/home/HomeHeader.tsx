import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import UserAvatar from '../UserAvatar';
import SearchBar from './SearchBar';

interface ActiveFilters {
  minRating: number | null;
  specialties: string[];
  maxDistance: number | null;
}

interface HomeHeaderProps {
  userName?: string;
  photoURL?: string;
  searchQuery: string;
  onChangeSearch: (text: string) => void;
  hasActiveFilters: boolean;
  activeFilters: ActiveFilters;
  onPressFilters: () => void;
  onClearFilters: () => void;
  topSpecialties: string[];
  selectedSpecialty: string | null;
  onSelectSpecialty: (specialty: string | null) => void;
  onSignOut: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  photoURL,
  searchQuery,
  onChangeSearch,
  hasActiveFilters,
  activeFilters,
  onPressFilters,
  onClearFilters,
  topSpecialties,
  selectedSpecialty,
  onSelectSpecialty,
  onSignOut,
}) => {
  return (
    <>
      <LinearGradient colors={["#1d3f5d", "#0F2027"]} style={styles.header}>
        <View style={styles.userInfoContainer}>
          <UserAvatar photoURL={photoURL} name={userName} size={40} />
          <Text style={styles.userInfoText}>Olá, {userName || 'Usuário'}</Text>
        </View>
        <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
          <Ionicons name="exit-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchRow}>
        <SearchBar value={searchQuery} onChangeText={onChangeSearch} />
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.activeFilterButton]}
          onPress={onPressFilters}
        >
          <MaterialIcons name="filter-list" size={24} color={hasActiveFilters ? '#FFFFFF' : '#1976D2'} />
        </TouchableOpacity>
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Filtros ativos:
            {activeFilters.minRating !== null && ` ${activeFilters.minRating}+ estrelas`}
            {activeFilters.specialties.length > 0 && ` ${activeFilters.specialties.length} especialidades`}
            {activeFilters.maxDistance !== null && ` ${activeFilters.maxDistance}km`}
          </Text>
          <TouchableOpacity onPress={onClearFilters} style={styles.clearFiltersButton}>
            <Text style={styles.clearFiltersText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.chipsContainer}>
        {topSpecialties.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, selectedSpecialty === s && { backgroundColor: '#007AFF' }]}
            onPress={() => onSelectSpecialty(selectedSpecialty === s ? null : s)}
          >
            <Text style={styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 120,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  signOutButton: {
    padding: 8,
  },
  searchRow: {
    marginTop: -30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  activeFilterButton: {
    backgroundColor: '#1976D2',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 6,
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  clearFiltersButton: {
    padding: 4,
  },
  clearFiltersText: {
    color: '#FF3B30',
    fontWeight: '500',
    fontSize: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1d3f5d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default HomeHeader;
