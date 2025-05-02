import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Cria um documento para o usuário no Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        profileComplete: false, // Perfil ainda não está completo
      });

      console.log("Usuário registrado com sucesso:", user.uid);
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      router.replace('/'); // Redireciona para a página de login
    } catch (error) {
      console.error('Erro ao registrar:', error);
      Alert.alert('Erro', 'Não foi possível criar a conta.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email:</Text>
      <TextInput 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
        autoCapitalize="none" 
        style={{ borderBottomWidth: 1, marginBottom: 10 }} 
      />
      
      <Text>Senha:</Text>
      <TextInput 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={{ borderBottomWidth: 1, marginBottom: 10 }} 
      />

      <Button title="Criar conta" onPress={handleRegister} />
    </View>
  );
}