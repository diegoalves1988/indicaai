import { FontAwesome } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../services/firebase";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID as string,
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().profileComplete) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/complete-profile");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      Alert.alert("Erro", "Email ou senha incorretos. Por favor, tente novamente.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type !== "success" || !result.params?.id_token) {
        Alert.alert("Erro", "Login com Google cancelado.");
        return;
      }

      const credential = GoogleAuthProvider.credential(result.params.id_token);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().profileComplete) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/complete-profile");
      }
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      Alert.alert("Erro", "Não foi possível entrar com Google.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>IndicaAi</Text>
        
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor="#A0A0A0" // Cor do placeholder ajustada
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          placeholderTextColor="#A0A0A0" // Cor do placeholder ajustada
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
        >
          <FontAwesome name="google" size={20} style={styles.icon} />
          <Text style={styles.googleButtonText}>Entrar com Google</Text>
        </TouchableOpacity>

        <View style={styles.linksContainer}>
          <Text style={styles.link} onPress={() => router.push("/forgot-password")}>
            Esqueci a senha
          </Text>
          <Text style={styles.separator}> | </Text>
          <Text style={styles.link} onPress={() => router.push("/register")}>
            Criar conta
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1d3f5d", // degrade azul claro pode ser simulado com LinearGradient
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    width: "90%",
    maxWidth: 360,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1d3f5d",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    justifyContent: "center",
  },
  googleButtonText:{
    color: "black",
    fontSize: 16,
    fontWeight: "600",
  },
  icon: {
    marginRight: 8,
  },
  linksContainer: {
    flexDirection: "row",
    marginTop: 16,
  },
  link: {
    color: "#1976D2",
    fontWeight: "500",
  },
  separator: {
    marginHorizontal: 8,
    color: "#6B7280",
  },
});
