import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { updateProfessional } from '../services/professionalService'; // Assumindo que getProfessionalByUserId será criada ou adaptada

// TODO: Implementar um componente de seleção múltipla para especialidades
// Exemplo de lista de especialidades (pode vir do backend ou ser fixa)
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

  useEffect(() => {
    const fetchProfessionalData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Buscar o documento do profissional associado ao userId
        const professionalsRef = collection(db, "professionals");
        const q = query(professionalsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const professionalDoc = querySnapshot.docs[0]; // Pega o primeiro resultado
          const data = professionalDoc.data();
          setProfessionalId(professionalDoc.id);
          setName(data.name || '');
          setCity(data.city || '');
          setSelectedSpecialties(data.specialties || []); // Garante que seja um array
          setObservations(data.observations || '');
        } else {
          Alert.alert("Erro", "Perfil profissional não encontrado.");
          router.back(); // Volta se não encontrar perfil
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
      router.back(); // Volta para a tela anterior após salvar
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
        setLoading(false);
    }
  };

  // Função para lidar com a seleção/desseleção de especialidades
  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  if (loading) {
    return <View style={styles.container}><Text>Carregando...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
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
      <View style={styles.specialtiesContainer}>
        {allSpecialties.map(spec => (
          <View key={spec} style={styles.checkboxContainer}>
            {/* TODO: Substituir por um componente Checkbox real */}
            <Button 
              title={`${selectedSpecialties.includes(spec) ? '✅' : '⬜️'} ${spec}`}
              onPress={() => toggleSpecialty(spec)}
            />
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

      <Button title="Salvar Alterações" onPress={handleUpdate} disabled={loading} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', // Para alinhar o texto no topo em Android
  },
  specialtiesContainer: {
    marginBottom: 15,
    flexDirection: 'row', // Ajustar conforme o componente de Checkbox
    flexWrap: 'wrap',     // Para quebrar linha
  },
  checkboxContainer: {
    marginRight: 10, // Espaçamento entre checkboxes
    marginBottom: 10,
  },
});

export default EditProfessionalProfile;

