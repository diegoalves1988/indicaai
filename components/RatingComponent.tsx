import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getUserRatingForProfessional, submitRating } from '../services/ratingService';

interface RatingComponentProps {
  professionalId: string;
  showRating?: boolean;
  averageRating?: number;
  totalRatings?: number;
  onRatingSubmitted?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const RatingComponent: React.FC<RatingComponentProps> = ({
  professionalId,
  showRating = false,
  averageRating = 0,
  totalRatings = 0,
  onRatingSubmitted,
  size = 'medium'
}) => {
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempRating, setTempRating] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Tamanhos de estrelas baseados no prop size
  const starSizes = {
    small: 16,
    medium: 24,
    large: 32
  };

  const starSize = starSizes[size];

  // Buscar a avaliação do usuário atual para este profissional
  useEffect(() => {
    const fetchUserRating = async () => {
      if (!user) return;
      
      try {
        const rating = await getUserRatingForProfessional(user.uid, professionalId);
        if (rating) {
          setUserRating(rating.rating);
        }
      } catch (error) {
        console.error('Erro ao buscar avaliação do usuário:', error);
      }
    };

    fetchUserRating();
  }, [user, professionalId]);

  // Função para submeter uma avaliação
  const handleSubmitRating = async (rating: number) => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para avaliar um profissional.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRating(professionalId, user.uid, rating);
      setUserRating(rating);
      setShowRatingModal(false);
      
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      
      Alert.alert('Sucesso', 'Sua avaliação foi registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao submeter avaliação:', error);
      Alert.alert('Erro', 'Não foi possível registrar sua avaliação. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderiza o modal de avaliação
  const renderRatingModal = () => {
    if (!showRatingModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Avaliar Profissional</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setTempRating(star)}
                disabled={isSubmitting}
              >
                <FontAwesome
                  name={tempRating !== null && star <= tempRating ? "star" : "star-o"}
                  size={36}
                  color={tempRating !== null && star <= tempRating ? "#FFD700" : "#D1D5DB"}
                  style={styles.modalStarIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.ratingText}>
            {tempRating === 1 && "Ruim"}
            {tempRating === 2 && "Regular"}
            {tempRating === 3 && "Bom"}
            {tempRating === 4 && "Muito Bom"}
            {tempRating === 5 && "Excelente"}
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowRatingModal(false);
                setTempRating(null);
              }}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modalButton, 
                styles.submitButton,
                (!tempRating || isSubmitting) && styles.disabledButton
              ]}
              onPress={() => tempRating && handleSubmitRating(tempRating)}
              disabled={!tempRating || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Exibição da média de avaliações (se houver pelo menos 10) */}
      {showRating && (
        <View style={styles.ratingDisplay}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome
                key={star}
                name="star"
                size={starSize}
                color={star <= Math.floor(averageRating) ? "#FFD700" : "#D1D5DB"}
                style={styles.starIcon}
              />
            ))}
            {averageRating % 1 !== 0 && (
              <FontAwesome
                name="star-half-empty"
                size={starSize}
                color="#FFD700"
                style={[styles.starIcon, { marginLeft: -starSize }]}
              />
            )}
          </View>
          <Text style={styles.averageText}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.totalText}>({totalRatings} avaliações)</Text>
        </View>
      )}
      
      {/* Exibição quando não há avaliações suficientes */}
      {!showRating && totalRatings > 0 && (
        <Text style={styles.pendingText}>
          {totalRatings} {totalRatings === 1 ? 'avaliação' : 'avaliações'} 
          {' '}(mínimo de 10 para exibir média)
        </Text>
      )}
      
      {/* Botão para avaliar */}
      <TouchableOpacity
        style={styles.rateButton}
        onPress={() => {
          setTempRating(userRating);
          setShowRatingModal(true);
        }}
      >
        <Text style={styles.rateButtonText}>
          {userRating ? "Editar Avaliação" : "Avaliar"}
        </Text>
      </TouchableOpacity>
      
      {/* Modal de avaliação */}
      {renderRatingModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginHorizontal: 2,
  },
  averageText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1C1C1E',
  },
  totalText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  pendingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  rateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1976D2',
    borderRadius: 20,
    marginTop: 8,
  },
  rateButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  modalStarIcon: {
    marginHorizontal: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 20,
    height: 20, // Altura fixa para evitar saltos no layout
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1976D2',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default RatingComponent;
