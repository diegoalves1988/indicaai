import CachedImage from 'expo-cached-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db, storage } from '../services/firebase';

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
    if (cep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        Alert.alert("Erro", "CEP não encontrado.");
        return;
      }
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

  const pickImage = async () => {
    setUploading(true);
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (pickerResult.canceled || !pickerResult.assets[0].uri) return;
      const manipResult = await ImageManipulator.manipulateAsync(
        pickerResult.assets[0].uri,
        [{ resize: { width: 500 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      const uploadUrl = await uploadImage(manipResult.uri);
      setPhotoURL(`${uploadUrl}?${Date.now()}`);
    } catch (error) {
      Alert.alert("Erro", "Falha ao processar a imagem");
    } finally {
      setUploading(false);
    }
  };

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
          photoURL,
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="large" color="#1d3f5d" />
            ) : photoURL ? (
              <CachedImage
                source={{ uri: photoURL }}
                style={styles.avatar}
                cacheKey={`avatar-${auth.currentUser?.uid}`}
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

        <Text style={styles.label}>Nome</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Seu nome completo"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Telefone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
          placeholder="(00) 00000-0000"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>CEP</Text>
        <TextInput
          value={cep}
          onChangeText={(text) => {
            setCep(text);
            if (text.length === 8) fetchAddressByCep(text);
          }}
          keyboardType="numeric"
          style={styles.input}
          placeholder="Digite seu CEP"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Rua</Text>
        <TextInput
          placeholder="Rua"
          value={address.street}
          onChangeText={(text) => setAddress((prev) => ({ ...prev, street: text }))}
          style={styles.input}
          placeholderTextColor="#888"
        />
        <Text style={styles.label}>Cidade</Text>
        <TextInput
          placeholder="Cidade"
          value={address.city}
          onChangeText={(text) => setAddress((prev) => ({ ...prev, city: text }))}
          style={styles.input}
          placeholderTextColor="#888"
        />
        <Text style={styles.label}>Estado</Text>
        <TextInput
          placeholder="Estado"
          value={address.state}
          onChangeText={(text) => setAddress((prev) => ({ ...prev, state: text }))}
          style={styles.input}
          placeholderTextColor="#888"
        />
        <Text style={styles.label}>País</Text>
        <TextInput
          placeholder="País"
          value={address.country}
          editable={false}
          style={[styles.input, { color: "#888" }]}
        />

        <TouchableOpacity
          style={[styles.button, (saving || uploading) && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={saving || uploading}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Salvar Perfil</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
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
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    color: "#1d3f5d",
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1d3f5d",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#1C1C1E",
  },
  button: {
    backgroundColor: "#1d3f5d",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});