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
  const hasSpecialties = topSpecialties.length > 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1d3f5d", "#0F2027"]} style={styles.headerBackground}>
        <View style={styles.headerContent}>
          <View style={styles.userInfoContainer}>
            <UserAvatar photoURL={photoURL} name={userName} size={44} />
            <View>
              <Text style={styles.greetingText}>Olá,</Text>
              <Text style={styles.userInfoText}>{userName || 'Usuário'}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
            <Ionicons name="exit-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.searchRow}>
          <SearchBar value={searchQuery} onChangeText={onChangeSearch} style={styles.searchBar} />
          <TouchableOpacity
            style={[styles.filterButton, hasActiveFilters && styles.activeFilterButton]}
            onPress={onPressFilters}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="filter-list"
              size={22}
              color={hasActiveFilters ? '#FFFFFF' : '#1d3f5d'}
            />
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

        {hasSpecialties && (
          <View style={styles.chipsContainer}>
            {topSpecialties.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedSpecialty === s && styles.activeChip]}
                onPress={() => onSelectSpecialty(selectedSpecialty === s ? null : s)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selectedSpecialty === s && styles.activeChipText]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerBackground: {
    width: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 96,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    color: '#E2E8F0',
    fontSize: 14,
    marginBottom: 2,
  },
  userInfoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  signOutButton: {
    padding: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -70,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  searchBar: {
    flex: 1,
    marginRight: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  activeFilterButton: {
    backgroundColor: '#1d3f5d',
    borderColor: '#1d3f5d',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#1d3f5d',
    flex: 1,
    marginRight: 12,
  },
  clearFiltersButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearFiltersText: {
    color: '#dc2626',
    fontWeight: '500',
    fontSize: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#1d3f5d',
    fontWeight: '500',
  },
  activeChip: {
    backgroundColor: '#1d3f5d',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
});

export default HomeHeader;
