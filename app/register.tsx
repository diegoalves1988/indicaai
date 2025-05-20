import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db, sendEmailVerification } from "../services/firebase"; // sendEmailVerification importado

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Novo estado para confirmar senha
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Enviar e-mail de verificação
      await sendEmailVerification(user);

      // Cria um documento para o usuário no Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: null, // Nome será preenchido em complete-profile
        photoURL: null, // photoURL será preenchido em complete-profile ou via Google
        profileComplete: false,
        createdAt: new Date().toISOString(),
      });

      console.log("Usuário registrado com sucesso:", user.uid);
      Alert.alert(
        "Sucesso!",
        "Conta criada com sucesso! Um e-mail de confirmação foi enviado para " +
          user.email +
          ". Por favor, verifique sua caixa de entrada para ativar sua conta antes de fazer login."
      );
      router.replace("/"); // Redireciona para a página de login
    } catch (error: any) {
      console.error("Erro ao registrar:", error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Erro", "Este e-mail já está em uso.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Erro", "O formato do e-mail é inválido.");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("Erro", "A senha é muito fraca. Por favor, escolha uma senha mais forte.");
      } else {
        Alert.alert("Erro", "Não foi possível criar a conta.");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Criar Conta</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha (mínimo 6 caracteres)"
          secureTextEntry
          style={styles.input}
        />

        <TextInput // Novo campo para confirmar senha
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repetir Senha"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Criar conta</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.loginLink}>Já tem uma conta? Faça login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    paddingBottom: 32, // margem extra para evitar sobreposição
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#1d3f5d",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#1d3f5d",
    fontSize: 16,
    color: "#1C1C1E"
  },
  button: {
    backgroundColor: "#1d3f5d",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginLink: {
    color: "#007AFF",
    textAlign: "center",
    fontSize: 14,
    marginTop: 10
  },
});

