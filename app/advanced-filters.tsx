import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Tipos de filtros
interface FilterOptions {
  minRating: number | null;
  specialties: string[];
  maxDistance: number | null;
}

export default function AdvancedFilters() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const userCity = params.userCity ? String(params.userCity) : '';
  const userState = params.userState ? String(params.userState) : '';

  // Estado inicial dos filtros (pode ser preenchido com valores dos params)
  const [filters, setFilters] = useState<FilterOptions>({
    minRating: params.minRating ? Number(params.minRating) : null,
    specialties: params.specialties ? String(params.specialties).split(',') : [],
    maxDistance: params.maxDistance !== undefined && params.maxDistance !== '' ? Number(params.maxDistance) : null,
  });

  // Lista de especialidades disponíveis (deve ser carregada do banco de dados)
  const availableSpecialties = [
    'Eletricista',
    'Encanador',
    'Pedreiro',
    'Pintor',
    'Diarista',
    'Jardineiro',
    'Marceneiro',
    'Técnico de Informática',
    'Técnico de Ar Condicionado',
  ];

  // Opções de localização
  const locationOptions: { label: string; value: number | null }[] = [
    { label: 'Todas as cidades', value: null },
  ];
  if (userCity) {
    locationOptions.push({ label: `Apenas ${userCity}`, value: 0 });
  }

  // Opções de avaliação
  const ratingOptions = [
    { label: 'Qualquer avaliação', value: null },
    { label: '3+ estrelas', value: 3 },
    { label: '4+ estrelas', value: 4 },
    { label: '4.5+ estrelas', value: 4.5 },
  ];

  // Função para alternar especialidade
  const toggleSpecialty = (specialty: string) => {
    setFilters(prev => {
      if (prev.specialties.includes(specialty)) {
        return {
          ...prev,
          specialties: prev.specialties.filter(s => s !== specialty)
        };
      } else {
        return {
          ...prev,
          specialties: [...prev.specialties, specialty]
        };
      }
    });
  };

  // Função para aplicar filtros e voltar para a home
  const applyFilters = () => {
    // Construir parâmetros de consulta
    const queryParams: Record<string, string> = { applied: '1' };
    
    if (filters.minRating !== null) {
      queryParams.minRating = filters.minRating.toString();
    }
    
    if (filters.specialties.length > 0) {
      queryParams.specialties = filters.specialties.join(',');
    }
    
    if (filters.maxDistance !== null) {
      queryParams.maxDistance = filters.maxDistance.toString();
    }
    
    // Navegar de volta para a home com os filtros aplicados
    router.push({
      pathname: '/(tabs)/home',
      params: queryParams
    });
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      minRating: null,
      specialties: [],
      maxDistance: null,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.title}>Filtros Avançados</Text>
        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Seção de Avaliação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliação Mínima</Text>
          <View style={styles.ratingOptions}>
            {ratingOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.ratingOption,
                  filters.minRating === option.value && styles.selectedRatingOption
                ]}
                onPress={() => setFilters(prev => ({ ...prev, minRating: option.value }))}
              >
                <Text 
                  style={[
                    styles.ratingOptionText,
                    filters.minRating === option.value && styles.selectedRatingOptionText
                  ]}
                >
                  {option.label}
                </Text>
                {option.value && (
                  <View style={styles.starsContainer}>
                    {[...Array(5)].map((_, i) => (
                      <FontAwesome
                        key={i}
                        name="star"
                        size={14}
                        color={i < Math.floor(option.value) ? "#FFD700" : "#D1D5DB"}
                        style={styles.starIcon}
                      />
                    ))}
                    {option.value % 1 !== 0 && (
                      <FontAwesome
                        name="star-half-empty"
                        size={14}
                        color="#FFD700"
                        style={[styles.starIcon, { marginLeft: -14 }]}
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seção de Localização */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localização</Text>
          {userCity ? (
            <View style={styles.locationInfo}>
              <Ionicons name="location-sharp" size={16} color="#607D8B" />
              <Text style={styles.locationInfoText}>Sua cidade: {userCity}{userState ? `, ${userState}` : ''}</Text>
            </View>
          ) : (
            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={16} color="#999" />
              <Text style={styles.locationInfoText}>Cadastre seu endereço no perfil para filtrar por cidade</Text>
            </View>
          )}
          <View style={styles.locationOptions}>
            {locationOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.locationOption,
                  filters.maxDistance === option.value && styles.selectedLocationOption,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, maxDistance: option.value }))}
              >
                <Ionicons
                  name={option.value === null ? 'globe-outline' : 'location-sharp'}
                  size={18}
                  color={filters.maxDistance === option.value ? '#FFFFFF' : '#4B5563'}
                />
                <Text
                  style={[
                    styles.locationOptionText,
                    filters.maxDistance === option.value && styles.selectedLocationOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seção de Especialidades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.specialtiesContainer}>
            {availableSpecialties.map((specialty, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.specialtyOption,
                  filters.specialties.includes(specialty) && styles.selectedSpecialtyOption
                ]}
                onPress={() => toggleSpecialty(specialty)}
              >
                <Text 
                  style={[
                    styles.specialtyOptionText,
                    filters.specialties.includes(specialty) && styles.selectedSpecialtyOptionText
                  ]}
                >
                  {specialty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
          <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  ratingOptions: {
    flexDirection: 'column',
    gap: 10,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedRatingOption: {
    borderColor: '#1976D2',
    backgroundColor: '#EBF5FF',
  },
  ratingOptionText: {
    fontSize: 16,
    color: '#4B5563',
  },
  selectedRatingOptionText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginLeft: 2,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  locationInfoText: {
    fontSize: 14,
    color: '#607D8B',
    flex: 1,
  },
  locationOptions: {
    flexDirection: 'column',
    gap: 10,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  selectedLocationOption: {
    borderColor: '#1d3f5d',
    backgroundColor: '#1d3f5d',
  },
  locationOptionText: {
    fontSize: 16,
    color: '#4B5563',
  },
  selectedLocationOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specialtyOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  selectedSpecialtyOption: {
    borderColor: '#1976D2',
    backgroundColor: '#EBF5FF',
  },
  specialtyOptionText: {
    fontSize: 14,
    color: '#4B5563',
  },
  selectedSpecialtyOptionText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
