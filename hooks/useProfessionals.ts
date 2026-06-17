import { useCallback, useEffect, useState } from 'react';
import { haversineDistanceKm } from '../services/locationService';
import { filterProfessionalsByRating, getProfessionals } from '../services/professionalService';
import { addFavorite, getFavorites, getUserProfile, removeFavorite } from '../services/userService';
import { useAuth } from './useAuth';

interface Professional {
  id: string;
  name?: string;
  specialty?: string | string[];
  specialties?: string[];
  city?: string;
  recommendationCount?: number;
  photoURL?: string;
  totalRatings?: number;
  averageRating?: number;
  showRating?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  distanceKm?: number;
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
  const [userCity, setUserCity] = useState<string>('');
  const [userState, setUserState] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true);
        const [profResult, favorites] = await Promise.all([
          getProfessionals(PAGE_SIZE),
          user ? getFavorites(user.uid) : [],
        ]);

        // Load user profile for city/state info
        if (user) {
          const profile = await getUserProfile(user.uid);
          if (profile?.address) {
            setUserCity(profile.address.city || '');
            setUserState(profile.address.state || '');
          }
          if (profile?.location?.latitude && profile?.location?.longitude) {
            setUserLocation({
              latitude: profile.location.latitude,
              longitude: profile.location.longitude,
            });
          } else {
            setUserLocation(null);
          }
        }

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
        const specs = p.specialties || (Array.isArray(p.specialty) ? p.specialty : p.specialty ? [p.specialty] : []);
        return specs.some((s) => activeFilters.specialties.includes(s));
      });
    }

    const normalizeCity = (city?: string) => city?.toLowerCase().trim() || '';
    const normalizedUserCity = normalizeCity(userCity);

    // maxDistance === 0: only user's city
    // maxDistance > 0: geolocation radius in km
    // maxDistance === null: all cities with same-city priority
    if (activeFilters.maxDistance === 0 && normalizedUserCity) {
      data = data.filter((p) => normalizeCity(p.city) === normalizedUserCity);
    } else if ((activeFilters.maxDistance || 0) > 0 && userLocation) {
      const maxDistance = activeFilters.maxDistance as number;
      data = data
        .map((p) => {
          if (!p.location?.latitude || !p.location?.longitude) {
            return null;
          }

          const distanceKm = haversineDistanceKm(userLocation, {
            latitude: p.location.latitude,
            longitude: p.location.longitude,
          });

          if (distanceKm > maxDistance) {
            return null;
          }

          return {
            ...p,
            distanceKm,
          };
        })
        .filter((item): item is Professional => item !== null)
        .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (normalizedUserCity && activeFilters.maxDistance === null) {
      data = [...data].sort((a, b) => {
        const aMatch = normalizeCity(a.city) === normalizedUserCity ? 0 : 1;
        const bMatch = normalizeCity(b.city) === normalizedUserCity ? 0 : 1;
        return aMatch - bMatch;
      });
    }
    setFilteredProfessionals(data);
  }, [searchQuery, activeFilters, professionals, userCity, userLocation]);

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
    userCity,
    userState,
    userLocation,
    setUserLocation,
  };
};

export type { ActiveFilters, Professional };

