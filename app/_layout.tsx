import { Stack, useFocusEffect, useRouter, useSegments } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Usa useFocusEffect para garantir que o redirecionamento ocorra após o navegador estar montado
  useFocusEffect(
    useCallback(() => {
      if (!loading && user) {
        const isAuthPage = segments.includes('(auth)'); // Verifica se está em uma rota de autenticação
        if (!user && !isAuthPage) {
          console.log('Redirecionando para a página inicial (index.tsx)');
          router.replace('/'); // Redireciona para a página inicial (index.tsx)
        } else if (user && isAuthPage) {
          console.log('Redirecionando para a página inicial após o login (/home)');
          router.replace('/home'); // Redireciona para a página inicial após o login
        }
      }
    }, [user, loading, segments])
  );

  // Exibe um indicador de carregamento enquanto verifica o estado de autenticação
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        
      </View>
    );
  }

  // Define as telas do Stack Navigator
  return (
    <Stack screenOptions={{
      headerShown: false, // Remove cabeçalho de todas as tabs
    }}>
      {/* Página inicial (index.tsx) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Página inicial após o login */}
      <Stack.Screen name="home" options={{ headerShown: false }} />

      {/* Tela de completar perfil */}
      <Stack.Screen name="complete-profile" options={{ headerShown: false }} />

      {/* Tela de "Esqueci a senha" */}
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />

      {/* Tela de "Criar conta" */}
      <Stack.Screen name="register" options={{ headerShown: false }} />

      {/* Tela para exibir perfil do amigo */}
      <Stack.Screen name="friend-profile" options={{ headerShown: false }} />

      {/* Tela para exibir perfil do profissional */}
      <Stack.Screen name="professional-profile" options={{ headerShown: false }} />

      {/* Tela para editar perfil do profissional */}
      <Stack.Screen name="edit-professional-profile" options={{ headerShown: false }} />
    </Stack>
  );
}