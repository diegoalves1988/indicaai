import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db, sendEmailVerification } from "../services/firebase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const router = useRouter();

  const validate = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setConfirmError("");

    if (!email) {
      setEmailError("Informe seu e-mail.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Formato de e-mail inválido.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Informe uma senha.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres.");
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError("Confirme sua senha.");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError("As senhas não coincidem.");
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: null,
        photoURL: null,
        profileComplete: false,
        createdAt: new Date().toISOString(),
      });

      router.replace("/verify-email");
    } catch (error: any) {
      console.error("Erro ao registrar:", error);
      if (error.code === "auth/email-already-in-use") {
        setEmailError("Este e-mail já está cadastrado.");
      } else if (error.code === "auth/invalid-email") {
        setEmailError("Formato de e-mail inválido.");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Senha muito fraca. Escolha uma senha mais forte.");
      } else {
        Alert.alert("Erro", "Não foi possível criar a conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <View style={styles.card}>
        <Text style={styles.appName}>IndicaAí</Text>
        <Text style={styles.subtitle}>Crie sua conta e comece a indicar</Text>

        {/* Aviso sobre verificação */}
        <View style={styles.infoBox}>
          <MaterialIcons name="mail-outline" size={18} color="#1976D2" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            Após o cadastro, enviaremos um e-mail de verificação. É rápido!
          </Text>
        </View>

        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); setEmailError(""); }}
          placeholder="E-mail"
          placeholderTextColor="#A0A0A0"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, emailError ? styles.inputError : null]}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <TextInput
          value={password}
          onChangeText={(t) => { setPassword(t); setPasswordError(""); }}
          placeholder="Senha (mínimo 6 caracteres)"
          placeholderTextColor="#A0A0A0"
          secureTextEntry
          style={[styles.input, passwordError ? styles.inputError : null]}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <TextInput
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setConfirmError(""); }}
          placeholder="Confirmar senha"
          placeholderTextColor="#A0A0A0"
          secureTextEntry
          style={[styles.input, confirmError ? styles.inputError : null]}
        />
        {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Criar conta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.loginLink}>Já tem uma conta? Faça login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#1d3f5d",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    width: "90%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  appName: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1d3f5d",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    width: "100%",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1976D2",
    lineHeight: 18,
  },
  input: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 4,
    color: "#1C1C1E",
  },
  inputError: {
    borderColor: "#f43f5e",
  },
  errorText: {
    alignSelf: "flex-start",
    color: "#f43f5e",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginLink: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "500",
  },
});

