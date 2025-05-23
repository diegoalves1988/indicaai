import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';

function NotificationTabIcon({ color, size }: { color: string; size: number }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      let count = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.toUserId === user.uid && !data.read) count++;
      });
      setUnreadCount(count);
    });
    return unsub;
  }, [user]);

  return (
    <View>
      <Ionicons name="notifications" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={{
          position: 'absolute',
          right: -6,
          top: -2,
          backgroundColor: '#DC3545',
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

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
      <Tabs.Screen 
        name="notifications" 
        options={{ 
          title: 'Notificações', 
          tabBarIcon: (props) => <NotificationTabIcon {...props} />
        }} 
      />
    </Tabs>
  );
}
