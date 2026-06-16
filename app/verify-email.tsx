import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { reload } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, sendEmailVerification } from "../services/firebase";

export default function VerifyEmail() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  const userEmail = auth.currentUser?.email ?? "";

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/");
        return;
      }
      await reload(user);
      if (user.emailVerified) {
        router.replace("/complete-profile");
      } else {
        Alert.alert(
          "E-mail não verificado",
          "Ainda não encontramos a verificação. Verifique sua caixa de entrada (e a pasta de spam) e tente novamente."
        );
      }
    } catch (error) {
      console.error("Erro ao verificar e-mail:", error);
      Alert.alert("Erro", "Não foi possível verificar o e-mail. Tente novamente.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      await sendEmailVerification(user);
      Alert.alert("E-mail reenviado", "Verifique sua caixa de entrada.");
    } catch (error: any) {
      if (error?.code === "auth/too-many-requests") {
        Alert.alert("Aguarde", "Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else {
        Alert.alert("Erro", "Não foi possível reenviar o e-mail.");
      }
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace("/");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="mark-email-unread" size={56} color="#1976D2" />
        </View>

        <Text style={styles.title}>Verifique seu e-mail</Text>

        <Text style={styles.description}>
          Enviamos um link de confirmação para:
        </Text>
        <Text style={styles.email}>{userEmail}</Text>

        <Text style={styles.hint}>
          Clique no link do e-mail e depois volte aqui para continuar.
          Não se esqueça de checar a pasta de <Text style={styles.bold}>spam</Text>.
        </Text>

        <TouchableOpacity
          style={[styles.button, checking && styles.buttonDisabled]}
          onPress={handleCheckVerification}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Já verifiquei, continuar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineButton, resending && styles.buttonDisabled]}
          onPress={handleResend}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator color="#1976D2" />
          ) : (
            <Text style={styles.outlineButtonText}>Reenviar e-mail</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleBackToLogin} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar para o login</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  iconContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 60,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1d3f5d",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  email: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1d3f5d",
    marginBottom: 16,
    textAlign: "center",
  },
  hint: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  bold: {
    fontWeight: "600",
    color: "#374151",
  },
  button: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  outlineButton: {
    borderColor: "#1976D2",
    borderWidth: 1.5,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  outlineButtonText: {
    color: "#1976D2",
    fontWeight: "600",
    fontSize: 15,
  },
  backLink: {
    paddingVertical: 4,
  },
  backLinkText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
});
