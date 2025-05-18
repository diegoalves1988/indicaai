import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../services/firebase";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Erro", "Digite seu e-mail");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Sucesso!", "Um e-mail foi enviado para redefinir sua senha.");
      router.push("/index"); // Redireciona para a tela de login após o envio
    } catch (error: any) {
      Alert.alert("Erro ao recuperar senha", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>
      <TextInput
        placeholder="Digite seu e-mail"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#888"
      />
      <TouchableOpacity onPress={handleResetPassword} style={styles.button}>
        <Text style={styles.buttonText}>Enviar e-mail de recuperação</Text>
      </TouchableOpacity>

      {/* Voltar para login */}
      <TouchableOpacity onPress={() => router.push("/")}>
        <Text style={styles.loginLink}>Voltar para Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#1d3f5d",
  },
  input: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#1d3f5d",
    fontSize: 16,
    color: "#1C1C1E",
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
    shadowRadius: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginLink: {
    color: "#007AFF",
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
  },
});

export default ForgotPasswordScreen;
