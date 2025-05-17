import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert, // Adicionado para KeyboardAvoidingView se necessário no futuro
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../services/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

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
          onPress={() => Alert.alert("Em breve", "Login com Google em manutenção. Por favor, use email e senha por enquanto.")}
        >
          <FontAwesome name="google" size={20} color="white" style={styles.icon} />
          <Text style={styles.buttonText}>Entrar com Google</Text>
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
    backgroundColor: "#283593", // Azul escuro inspirado no header da imagem
  },
  innerContainer: { // Adicionado para centralizar o conteúdo e aplicar padding
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 36, // Ligeiramente aumentado para mais destaque
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40, // Aumentado o espaçamento
    color: "#FFFFFF", // Branco para contraste com o fundo azul
  },
  input: {
    backgroundColor: "#FFFFFF", // Fundo branco para os inputs
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#5C6BC0", // Azul mais claro para a borda, da paleta da imagem
    fontSize: 16,
    color: "#000000", // Texto do input preto para legibilidade
  },
  button: {
    backgroundColor: "#3F51B5", // Azul médio inspirado nos botões da imagem
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  googleButton: {
    backgroundColor: "#42A5F5", // Um azul diferente para o botão do Google, mas dentro da paleta
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF", // Texto do botão branco
    fontWeight: "bold",
    fontSize: 16,
  },
  icon: {
    marginRight: 10,
  },
  linksContainer: {
    flexDirection: "row",
    marginTop: 20, // Aumentado o espaçamento superior
    justifyContent: "center",
  },
  link: {
    color: "#90CAF9", // Azul bem claro para os links, para contraste no fundo escuro
    fontSize: 14,
    fontWeight: "500", // Ligeiramente mais forte
  },
  separator: {
    fontSize: 14,
    color: "#C5CAE9", // Cor suave para o separador, combinando com a paleta
    marginHorizontal: 5,
  },
});