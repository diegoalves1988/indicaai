import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Checkbox } from 'react-native-paper'; // Instale: npm install react-native-paper
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { updateProfessional } from '../services/professionalService';

const allSpecialties = [
  "Pedreiro", "Eletricista", "Encanador", "Jardineiro", "Faxineira",
  "Diarista", "Pintor", "Carpinteiro", "Marceneiro", "Montador de Móveis",
  "Instalador de Câmeras", "Técnico de Informática"
];

const EditProfessionalProfile = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [observations, setObservations] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const professionalsRef = collection(db, "professionals");
        const q = query(professionalsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const professionalDoc = querySnapshot.docs[0];
          const data = professionalDoc.data();
          setProfessionalId(professionalDoc.id);
          setName(data.name || '');
          setCity(data.city || '');
          setSelectedSpecialties(data.specialties || []);
          setObservations(data.observations || '');
        } else {
          Alert.alert("Erro", "Perfil profissional não encontrado.");
          router.back();
        }
      } catch (error) {
        console.error("Erro ao buscar dados do profissional:", error);
        Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalData();
  }, [user]);

  const handleUpdate = async () => {
    if (!professionalId) {
        Alert.alert("Erro", "ID do profissional não encontrado.");
        return;
    }
    if (!name || !city || selectedSpecialties.length === 0) {
      Alert.alert('Erro', 'Nome, cidade e pelo menos uma especialidade são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      await updateProfessional(professionalId, {
        name,
        city,
        specialties: selectedSpecialties,
        observations,
      });
      Alert.alert('Sucesso', 'Perfil profissional atualizado!');
      router.back();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
        setLoading(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const removeSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => prev.filter(s => s !== specialty));
  };

  const filteredSpecialties = allSpecialties.filter(specialty =>
    specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <View style={styles.container}><Text>Carregando...</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.label}>Nome:</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Seu nome completo"
      />

      <Text style={styles.label}>Cidade:</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        style={styles.input}
        placeholder="Cidade onde atua"
      />

      <Text style={styles.label}>Especialidades:</Text>
      
      {/* Campo de busca */}
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.input}
        placeholder="Buscar especialidades..."
      />

      {/* Lista de especialidades filtradas */}
      {searchQuery && (
        <View style={styles.dropdown}>
          <FlatList
            data={filteredSpecialties}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => toggleSpecialty(item)}
              >
                <Checkbox
                  status={selectedSpecialties.includes(item) ? "checked" : "unchecked"}
                  color="#007AFF"
                />
                <Text style={styles.dropdownText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Tags das especialidades selecionadas */}
      <View style={styles.tagsContainer}>
        {selectedSpecialties.map((specialty) => (
          <View key={specialty} style={styles.tag}>
            <Text style={styles.tagText}>{specialty}</Text>
            <TouchableOpacity onPress={() => removeSpecialty(specialty)}>
              <Text style={styles.tagClose}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.label}>Bio:</Text>
      <TextInput
        value={observations}
        onChangeText={setObservations}
        style={[styles.input, styles.textArea]}
        placeholder="Detalhes sobre seus serviços, experiência, etc."
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleUpdate} 
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownText: {
    marginLeft: 8,
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tag: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  tagText: {
    color: '#1976d2',
    marginRight: 6,
  },
  tagClose: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfessionalProfile;