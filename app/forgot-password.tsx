import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { useRouter } from "expo-router";

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
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Recuperar Senha</Text>
      <TextInput
        placeholder="Digite seu e-mail"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />
      <TouchableOpacity onPress={handleResetPassword} style={{ backgroundColor: "orange", padding: 15, borderRadius: 5 }}>
        <Text style={{ color: "white", textAlign: "center" }}>Enviar e-mail de recuperação</Text>
      </TouchableOpacity>

      {/* Voltar para login */}
      <TouchableOpacity onPress={() => router.push("/index")} style={{ marginTop: 15 }}>
        <Text style={{ color: "blue", textAlign: "center" }}>Voltar para Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPasswordScreen;
