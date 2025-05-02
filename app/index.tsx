import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar se o perfil está completo
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().profileComplete) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/complete-profile');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error); // Log do erro
      Alert.alert('Erro', 'Email ou senha incorretos.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
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

      <Button title="Entrar" onPress={handleLogin} />
      
      <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'center' }}>
        <Text style={{ color: 'blue' }} onPress={() => router.push('/forgot-password')}>
          Esqueci a senha
        </Text>
        <Text>  |  </Text>
        <Text style={{ color: 'blue' }} onPress={() => router.push('/register')}>
          Criar conta
        </Text>
      </View>
    </View>
  );
}