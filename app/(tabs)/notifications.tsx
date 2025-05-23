import { useRouter } from "expo-router";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import UserAvatar from "../../components/UserAvatar";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../services/firebase";
import { getUserProfile } from "../../services/userService";

interface Notification {
  id: string;
  toUserId: string;
  fromUserId: string;
  professionalId: string;
  type: string;
  createdAt: any;
  read: boolean;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.toUserId === user.uid) {
          notifs.push({ id: docSnap.id, ...data } as Notification);
        }
      });
      setNotifications(notifs);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível marcar como lida.");
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const [fromUser, setFromUser] = useState<any>(null);
    useEffect(() => {
      let mounted = true;
      getUserProfile(item.fromUserId).then((profile) => {
        if (mounted) setFromUser(profile);
      });
      return () => { mounted = false; };
    }, [item.fromUserId]);

    return (
      <TouchableOpacity
        style={[styles.notification, !item.read && styles.unread]}
        onPress={async () => {
          await markAsRead(item.id);
          router.push({ pathname: "/professional-profile", params: { id: item.professionalId } });
        }}
      >
        <UserAvatar photoURL={fromUser?.photoURL} name={fromUser?.name} size={40} />
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            {item.type === "recommendation"
              ? `${fromUser?.name || "Alguém"} recomendou seu perfil!`
              : "Nova notificação"}
          </Text>
          <Text style={styles.date}>{item.createdAt?.toDate?.().toLocaleString?.() || ""}</Text>
        </View>
        {!item.read && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1976D2" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificações</Text>
      {notifications.length === 0 ? (
        <View style={styles.centered}><Text>Nenhuma notificação.</Text></View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingTop: 40 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1d3f5d", marginBottom: 20, textAlign: "center" },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  unread: {
    borderColor: "#1976D2",
    backgroundColor: "#E3F2FD",
  },
  textContainer: { flex: 1, marginLeft: 16 },
  text: { fontSize: 16, color: "#1C1C1E", fontWeight: "500" },
  date: { fontSize: 12, color: "#888", marginTop: 4 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1976D2",
    marginLeft: 8,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
