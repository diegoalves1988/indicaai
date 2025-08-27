export interface ProfessionalRatingStats {
  totalRatings: number;
  averageRating: number;
  showRating: boolean;
}

const MIN_RATINGS_TO_SHOW = 10;

/**
 * Calcula estatísticas de avaliação para um conjunto de notas
 */
export const calculateRatingStats = (ratings: number[]): ProfessionalRatingStats => {
  const totalRatings = ratings.length;
  const sum = ratings.reduce((acc, curr) => acc + curr, 0);
  const averageRating = totalRatings > 0 ? sum / totalRatings : 0;
  const showRating = totalRatings >= MIN_RATINGS_TO_SHOW;
  return { totalRatings, averageRating, showRating };
};
