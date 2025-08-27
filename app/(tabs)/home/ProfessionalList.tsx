import React from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import ProfessionalCard from './ProfessionalCard';

interface Professional {
  id: string;
  name?: string;
  specialty?: string | string[];
  city?: string;
  recommendationCount?: number;
  photoURL?: string;
  averageRating?: number;
  showRating?: boolean;
}

interface ProfessionalListProps {
  professionals: Professional[];
  favoriteIds: string[];
  favoriteLoading: boolean;
  onToggleFavorite: (id: string) => void;
  onPressProfessional: (id: string) => void;
}

const ProfessionalList: React.FC<ProfessionalListProps> = ({ professionals, favoriteIds, favoriteLoading, onToggleFavorite, onPressProfessional }) => {
  const renderItem = ({ item }: { item: Professional }) => (
    <ProfessionalCard
      professional={item}
      isFavorite={favoriteIds.includes(item.id)}
      favoriteLoading={favoriteLoading}
      onToggleFavorite={onToggleFavorite}
      onPress={() => onPressProfessional(item.id)}
    />
  );

  if (professionals.length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>Nenhum profissional encontrado</Text>
        <Text style={styles.emptyStateSubtext}>Tente ajustar sua busca ou filtros.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={professionals}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ProfessionalList;
