import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import UserAvatar from '../../../components/UserAvatar';

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

interface ProfessionalCardProps {
  professional: Professional;
  isFavorite: boolean;
  favoriteLoading: boolean;
  onToggleFavorite: (id: string) => void;
  onPress: () => void;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ professional, isFavorite, favoriteLoading, onToggleFavorite, onPress }) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
        <UserAvatar photoURL={professional.photoURL} name={professional.name} size={64} />
        <Text style={styles.name}>{professional.name}</Text>
        <Text style={styles.role}>{Array.isArray(professional.specialty) ? professional.specialty[0] : professional.specialty}</Text>
        <Text style={styles.city}>{professional.city}</Text>

        {professional.showRating && professional.averageRating !== undefined && (
          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={14}
                  color={i < Math.floor(professional.averageRating!) ? '#FFD700' : '#D1D5DB'}
                  style={styles.starIcon}
                />
              ))}
              {professional.averageRating % 1 !== 0 && (
                <Ionicons
                  name="star-half"
                  size={14}
                  color="#FFD700"
                  style={[styles.starIcon, { marginLeft: -14 }]}
                />
              )}
            </View>
            <Text style={styles.ratingText}>{professional.averageRating.toFixed(1)}</Text>
          </View>
        )}

        <View style={styles.recommendationRow}>
          {professional.recommendationCount && professional.recommendationCount > 0 && (
            <Ionicons name="thumbs-up" size={16} color="#1976D2" />
          )}
          <Text style={styles.recommendationText}>
            {professional.recommendationCount === 0 || professional.recommendationCount === undefined
              ? 'Nenhuma recomendação'
              : professional.recommendationCount === 1
                ? '1 recomendação'
                : `${professional.recommendationCount} recomendações`}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onToggleFavorite(professional.id)}
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}
        disabled={favoriteLoading}
        accessibilityLabel={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <FontAwesome
          name={isFavorite ? 'heart' : 'heart-o'}
          size={18}
          color={isFavorite ? '#e53935' : '#888'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginTop: 8,
  },
  role: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  city: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginHorizontal: 1,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginLeft: 4,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: '#000000',
  },
});

export default ProfessionalCard;
