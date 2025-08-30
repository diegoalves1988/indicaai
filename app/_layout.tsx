import { Stack, useFocusEffect, useRouter, useSegments } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
    );
  }

  // Define as telas do Stack Navigator
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      <Stack screenOptions={{
        headerShown: false, 
      }}>
        <Stack.Screen name="index" />
        {/* As rotas dentro de (tabs) são gerenciadas pelo _layout.tsx de (tabs) */}
        <Stack.Screen name="(tabs)" /> 
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="register" />
        <Stack.Screen name="friend-profile" />
        <Stack.Screen name="add-friend" />
        <Stack.Screen name="professional-profile" />
        <Stack.Screen name="edit-professional-profile" />
        <Stack.Screen name="register-professional" />
        <Stack.Screen name="advanced-filters" />
      </Stack>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Cor de fundo padrão, pode ser ajustada
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

