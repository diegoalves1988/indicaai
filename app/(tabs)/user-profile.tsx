import { useRouter } from 'expo-router'; // Importar useRouter
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MaskInput from 'react-native-mask-input';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';

function UserProfileScreen() {
  const { user } = useAuth();
  const router = useRouter(); // Inicializar useRouter
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [isProfessional, setIsProfessional] = useState(false); // Estado para verificar se é profissional
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        if (data) {
          setName(data.name || '');
          setPhone(data.phone || '');
          setIsProfessional(data.professionalProfile || false); // Carregar status de profissional

          const address = data.address || {};
          setCep(address.cep || '');
          setStreet(address.street || '');
          setCity(address.city || '');
          setState(address.state || '');
          setCountry(address.country || '');
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        Alert.alert('Erro', 'Erro ao carregar os dados do usuário.');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const fetchAddressFromCep = async (rawCep: string) => {
    const numericCep = rawCep.replace(/\D/g, '');
    if (numericCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        Alert.alert('CEP não encontrado', 'Por favor, verifique o CEP digitado.');
        return;
      }

      setStreet(data.logradouro || '');
      setCity(data.localidade || '');
      setState(data.uf || '');
      setCountry('Brasil');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar o endereço pelo CEP.');
    }
  };

  const handleCepChange = (formatted: string, extracted?: string) => {
    setCep(formatted);
    if (extracted && extracted.length === 8) {
      fetchAddressFromCep(extracted);
    }
  };

  const handlePhoneChange = (formatted: string, extracted?: string) => {
    setPhone(formatted);
  };

  const handleSave = async () => {
    if (!user) return;

    const address = {
      cep,
      street,
      city,
      state,
      country,
    };

    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        phone,
        address,
        // Não atualizamos professionalProfile aqui, isso é feito no cadastro/remoção do perfil profissional
      });
      Alert.alert('Sucesso', 'Dados atualizados com sucesso.');
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  const navigateToEditProfessionalProfile = () => {
    router.push('/edit-professional-profile'); // Navega para a tela de edição
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }


return (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Meu Perfil Pessoal</Text>

    <TextInput
      style={styles.input}
      placeholder="Nome"
      value={name}
      onChangeText={setName}
    />

    <MaskInput
      style={styles.input}
      placeholder="Telefone"
      value={phone}
      onChangeText={(masked, unmasked) => handlePhoneChange(masked)}
      mask={['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
      keyboardType="phone-pad"
    />

    <Text style={styles.sectionTitle}>Endereço</Text>

    <MaskInput
      style={styles.input}
      placeholder="CEP"
      value={cep}
      onChangeText={(masked, unmasked) => handleCepChange(masked)}
      mask={[/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/]}
      keyboardType="numeric"
    />

    <TextInput
      style={styles.input}
      placeholder="Rua"
      value={street}
      onChangeText={setStreet}
    />

    <TextInput
      style={styles.input}
      placeholder="Cidade"
      value={city}
      onChangeText={setCity}
    />

    <TextInput
      style={styles.input}
      placeholder="Estado"
      value={state}
      onChangeText={setState}
    />

    <TextInput
      style={styles.input}
      placeholder="País"
      value={country}
      onChangeText={setCountry}
    />

    <View style={styles.buttonContainer}>
        <Button
          title={saving ? 'Salvando...' : 'Salvar Alterações Pessoais'}
          onPress={handleSave}
          disabled={saving}
        />
    </View>

    {/* Botão condicional para editar perfil profissional */}
    {isProfessional && (
        <View style={styles.buttonContainer}>
            <Button
                title="Editar Perfil Profissional"
                onPress={navigateToEditProfessionalProfile}
                color="#007AFF" // Cor diferente para destacar
            />
        </View>
    )}

  </ScrollView>
);

}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40, // Mais espaço no final
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 10, // Ajuste padding
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
      marginTop: 15, // Espaçamento entre botões
  }
});


export default UserProfileScreen;

