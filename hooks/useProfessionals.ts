import { useAuth } from './useAuth';
import { useCallback, useEffect, useState } from 'react';
import { filterProfessionalsByRating, getProfessionals } from '../services/professionalService';
import { addFavorite, getFavorites, removeFavorite } from '../services/userService';

interface Professional {
  id: string;
  name?: string;
  specialty?: string | string[];
  city?: string;
  recommendationCount?: number;
  photoURL?: string;
  totalRatings?: number;
  averageRating?: number;
  showRating?: boolean;
}

interface ActiveFilters {
  minRating: number | null;
  specialties: string[];
  maxDistance: number | null;
}

export const useProfessionals = () => {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    minRating: null,
    specialties: [],
    maxDistance: null,
  });
  const [topSpecialties, setTopSpecialties] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true);
        const [profResult, favorites] = await Promise.all([
          getProfessionals(PAGE_SIZE),
          user ? getFavorites(user.uid) : [],
        ]);

        setProfessionals(profResult.professionals);
        setFilteredProfessionals(profResult.professionals);
        setLastDoc(profResult.lastDoc);
        setFavoriteIds(favorites);

        const specialtyCount: Record<string, number> = {};
        profResult.professionals.forEach((p) => {
          const specs = Array.isArray(p.specialty) ? p.specialty : p.specialty ? [p.specialty] : [];
          specs.forEach((s) => {
            specialtyCount[s] = (specialtyCount[s] || 0) + 1;
          });
        });
        setTopSpecialties(
          Object.keys(specialtyCount)
            .sort((a, b) => specialtyCount[b] - specialtyCount[a])
            .slice(0, 5)
        );
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [user]);

  const loadMoreProfessionals = useCallback(async () => {
    if (loadingMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const result = await getProfessionals(PAGE_SIZE, lastDoc);
      setProfessionals((prev) => {
        const updated = [...prev, ...result.professionals];
        const specialtyCount: Record<string, number> = {};
        updated.forEach((p) => {
          const specs = Array.isArray(p.specialty) ? p.specialty : p.specialty ? [p.specialty] : [];
          specs.forEach((s) => {
            specialtyCount[s] = (specialtyCount[s] || 0) + 1;
          });
        });
        setTopSpecialties(
          Object.keys(specialtyCount)
            .sort((a, b) => specialtyCount[b] - specialtyCount[a])
            .slice(0, 5)
        );
        return updated;
      });
      setLastDoc(result.lastDoc);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, lastDoc]);

  const toggleFavorite = useCallback(async (id: string) => {
    if (!user) return;
    setFavoriteLoading(true);
    try {
      if (favoriteIds.includes(id)) {
        await removeFavorite(user.uid, id);
        setFavoriteIds((prev) => prev.filter((f) => f !== id));
      } else {
        await addFavorite(user.uid, id);
        setFavoriteIds((prev) => [...prev, id]);
      }
    } finally {
      setFavoriteLoading(false);
    }
  }, [favoriteIds, user]);

  useEffect(() => {
    let data = professionals;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter((p) => p.name?.toLowerCase().includes(query));
    }
    if (activeFilters.minRating) {
      data = filterProfessionalsByRating(data, activeFilters.minRating);
    }
    if (activeFilters.specialties.length > 0) {
      data = data.filter((p) => {
        const specs = Array.isArray(p.specialty) ? p.specialty : p.specialty ? [p.specialty] : [];
        return specs.some((s) => activeFilters.specialties.includes(s));
      });
    }
    setFilteredProfessionals(data);
  }, [searchQuery, activeFilters, professionals]);

  const clearFilters = useCallback(() => {
    setActiveFilters({ minRating: null, specialties: [], maxDistance: null });
  }, []);

  return {
    professionals: filteredProfessionals,
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
    hasMore: !!lastDoc,
    loadingMore,
  };
};

export type { Professional, ActiveFilters };
