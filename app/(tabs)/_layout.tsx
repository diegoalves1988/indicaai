import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
        headerShown: false, // Remove cabeçalho de todas as tabs
      }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Início', 
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="recommended-professionals" 
        options={{ 
          title: 'Recomendados', 
          tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="friends" 
        options={{ 
          title: 'Amigos', 
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="user-profile" 
        options={{ 
          title: 'Eu', 
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
        }} 
      />
    </Tabs>
  );
}
