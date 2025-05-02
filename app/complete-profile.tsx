import React, { useState } from 'react';
import { ActivityIndicator, View, Text, TextInput, Button, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { auth, db, storage } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import CachedImage from 'expo-cached-image';

export default function CompleteProfile() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState({ street: "", city: "", state: "", country: "Brasil" });
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return; // O CEP precisa ter 8 dígitos

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        Alert.alert("Erro", "CEP não encontrado.");
        return;
      }

      // Atualiza os campos do endereço com os dados retornados
      setAddress({
        street: data.logradouro,
        city: data.localidade,
        state: data.uf,
        country: "Brasil",
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      Alert.alert("Erro", "Não foi possível buscar o endereço.");
    }
  };

  // 1. SELECIONAR FOTO DA GALERIA
  const pickImage = async () => {
    setUploading(true);
    try {
      // 1. Seleciona a imagem da galeria
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Permite recortar
        aspect: [1, 1],     // Proporção quadrada
        quality: 0.7,       // Compressão inicial
      });
  
      if (pickerResult.canceled || !pickerResult.assets[0].uri) return;
  
      // 2. Redimensiona e comprime a imagem
      const manipResult = await ImageManipulator.manipulateAsync(
        pickerResult.assets[0].uri, // URI da imagem original
        [{ resize: { width: 500 } }], // Largura máxima de 500px (altura proporcional)
        { 
          compress: 0.7, // Nova compressão (0.7 = 70% da qualidade)
          format: ImageManipulator.SaveFormat.JPEG // Formato de saída
        }
      );
  
      // 3. Faz upload da imagem processada
      const uploadUrl = await uploadImage(manipResult.uri);
      setPhotoURL(`${uploadUrl}?${Date.now()}`); // Atualiza o estado com timestamp
  
    } catch (error) {
      Alert.alert("Erro", "Falha ao processar a imagem");
    } finally {
      setUploading(false);
    }
  };

    // 2. UPLOAD PARA O FIREBASE STORAGE
    const uploadImage = async (uri: string) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile-pics/${auth.currentUser?.uid}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    };


    const handleSaveProfile = async () => {
      if (!name || !phone || !cep || !address.street || !address.city || !address.state) {
        Alert.alert("Erro", "Por favor, preencha todos os campos.");
        return;
      }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          name,
          phone,
          photoURL, // URL da foto no Storage
          address: { ...address, cep },
          profileComplete: true,
        });
        router.replace("/home");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* SEÇÃO DA FOTO */}
      <View style={styles.photoSection}>
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          {uploading ? (
           <ActivityIndicator size="large" color="#0000ff" />
         ) : photoURL ? (
          <CachedImage
            source={{ uri: photoURL }}
            style={styles.avatar}
            cacheKey={`avatar-${auth.currentUser?.uid}`} // Corrigido aqui
            placeholderContent={
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.placeholderText}>
                  {name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            }
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.placeholderText}>+</Text>
          </View>
        )}
      </TouchableOpacity>
        <Text style={styles.photoLabel}>
          {uploading ? "Enviando..." : "Adicionar foto"}
        </Text>
      </View>

      {/* FORMULÁRIO */}
      <Text style={styles.label}>Nome</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Seu nome completo"
      />

      <Text style={styles.label}>Telefone</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
        placeholder="(00) 00000-0000"
      />

      <Text>CEP</Text>
      <TextInput
        value={cep}
        onChangeText={(text) => {
          setCep(text);
          if (text.length === 8) fetchAddressByCep(text);
        }}
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />

<Text>Endereço</Text>
      <TextInput
        placeholder="Rua"
        value={address.street}
        onChangeText={(text) => setAddress((prev) => ({ ...prev, street: text }))}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Cidade"
        value={address.city}
        onChangeText={(text) => setAddress((prev) => ({ ...prev, city: text }))}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Estado"
        value={address.state}
        onChangeText={(text) => setAddress((prev) => ({ ...prev, state: text }))}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput placeholder="País" value={address.country} editable={false} style={{ borderBottomWidth: 1, marginBottom: 10 }} />

      {/* BOTÃO DE SALVAR */}
      <Button
        title={saving ? "Salvando..." : "Salvar Perfil"}
        onPress={handleSaveProfile}
        disabled={saving || uploading}
      />
    </View>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: { padding: 20 },
  photoSection: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 36, color: '#666' },
  photoLabel: { marginTop: 8, color: '#666', fontSize: 14 },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: {
    borderBottomWidth: 1,
    marginBottom: 15,
    paddingVertical: 8,
    fontSize: 16,
  },
});