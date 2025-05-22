import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase';

// Interfaces
export interface Rating {
  id?: string;
  professionalId: string;
  userId: string;
  rating: number; // 1-5
  timestamp: Timestamp;
}

export interface ProfessionalRatingStats {
  totalRatings: number;
  averageRating: number;
  showRating: boolean; // true se totalRatings >= 10
}

// Constantes
const RATINGS_COLLECTION = 'ratings';
const PROFESSIONALS_COLLECTION = 'professionals';
const MIN_RATINGS_TO_SHOW = 10;

/**
 * Submete uma avaliação para um profissional
 * Se o usuário já avaliou este profissional, a avaliação é atualizada
 */
export const submitRating = async (professionalId: string, userId: string, rating: number): Promise<void> => {
  if (rating < 1 || rating > 5) {
    throw new Error('A avaliação deve ser entre 1 e 5 estrelas');
  }

  try {
    // Verificar se o profissional existe
    const professionalRef = doc(db, PROFESSIONALS_COLLECTION, professionalId);
    const professionalSnap = await getDoc(professionalRef);
    
    if (!professionalSnap.exists()) {
      throw new Error('Profissional não encontrado');
    }

    // Verificar se o usuário já avaliou este profissional
    const ratingsRef = collection(db, RATINGS_COLLECTION);
    const q = query(
      ratingsRef, 
      where('professionalId', '==', professionalId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Atualizar avaliação existente
      const ratingDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, RATINGS_COLLECTION, ratingDoc.id), {
        rating,
        timestamp: Timestamp.now()
      });
    } else {
      // Criar nova avaliação
      const newRatingRef = doc(collection(db, RATINGS_COLLECTION));
      await setDoc(newRatingRef, {
        professionalId,
        userId,
        rating,
        timestamp: Timestamp.now()
      });
    }

    // Recalcular e atualizar a média no perfil do profissional
    await updateProfessionalRatingStats(professionalId);
    
    return;
  } catch (error) {
    console.error('Erro ao submeter avaliação:', error);
    throw error;
  }
};

/**
 * Recalcula e atualiza as estatísticas de avaliação de um profissional
 */
export const updateProfessionalRatingStats = async (professionalId: string): Promise<void> => {
  try {
    // Buscar todas as avaliações do profissional
    const ratingsRef = collection(db, RATINGS_COLLECTION);
    const q = query(ratingsRef, where('professionalId', '==', professionalId));
    const querySnapshot = await getDocs(q);
    
    const totalRatings = querySnapshot.size;
    let sum = 0;
    
    querySnapshot.forEach(doc => {
      const ratingData = doc.data();
      sum += ratingData.rating;
    });
    
    const averageRating = totalRatings > 0 ? sum / totalRatings : 0;
    const showRating = totalRatings >= MIN_RATINGS_TO_SHOW;
    
    // Atualizar o perfil do profissional
    const professionalRef = doc(db, PROFESSIONALS_COLLECTION, professionalId);
    await updateDoc(professionalRef, {
      totalRatings,
      averageRating,
      showRating
    });
    
    return;
  } catch (error) {
    console.error('Erro ao atualizar estatísticas de avaliação:', error);
    throw error;
  }
};

/**
 * Obtém a avaliação de um usuário para um profissional específico
 */
export const getUserRatingForProfessional = async (userId: string, professionalId: string): Promise<Rating | null> => {
  try {
    const ratingsRef = collection(db, RATINGS_COLLECTION);
    const q = query(
      ratingsRef, 
      where('professionalId', '==', professionalId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const ratingDoc = querySnapshot.docs[0];
    return {
      id: ratingDoc.id,
      ...ratingDoc.data()
    } as Rating;
  } catch (error) {
    console.error('Erro ao buscar avaliação do usuário:', error);
    throw error;
  }
};

/**
 * Obtém as estatísticas de avaliação de um profissional
 */
export const getProfessionalRatingStats = async (professionalId: string): Promise<ProfessionalRatingStats> => {
  try {
    const professionalRef = doc(db, PROFESSIONALS_COLLECTION, professionalId);
    const professionalSnap = await getDoc(professionalRef);
    
    if (!professionalSnap.exists()) {
      throw new Error('Profissional não encontrado');
    }
    
    const data = professionalSnap.data();
    
    return {
      totalRatings: data.totalRatings || 0,
      averageRating: data.averageRating || 0,
      showRating: data.showRating || false
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de avaliação:', error);
    throw error;
  }
};

/**
 * Filtra profissionais por avaliação mínima
 */
export const filterProfessionalsByRating = async (minRating: number): Promise<string[]> => {
  try {
    const professionalsRef = collection(db, PROFESSIONALS_COLLECTION);
    const q = query(
      professionalsRef,
      where('showRating', '==', true),
      where('averageRating', '>=', minRating),
      orderBy('averageRating', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Erro ao filtrar profissionais por avaliação:', error);
    throw error;
  }
};
