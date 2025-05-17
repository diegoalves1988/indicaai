import { FontAwesome } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db, sendEmailVerification } from "../services/firebase"; // sendEmailVerification importado

// Necessário para o fluxo de autenticação web do Expo Auth Session
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Configuração do Google Sign-In
  // Usando o ID do cliente da Web do Firebase para ambos webClientId e expoClientId
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "859975350986-ti8efpo82l4f14spa7ss3pipm6kuiiog.apps.googleusercontent.com", // Mesmo que o Web Client ID para Expo Go
    webClientId: "859975350986-ti8efpo82l4f14spa7ss3pipm6kuiiog.apps.googleusercontent.com", // ID do cliente da Web do Firebase
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          // Verificar se é um novo usuário ou existente
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            // Novo usuário via Google
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              photoURL: user.photoURL,
              profileComplete: false, // Perfil inicial incompleto
              createdAt: new Date().toISOString(),
            });
            router.replace("/complete-profile");
          } else {
            // Usuário existente via Google
            if (userSnap.data()?.profileComplete) {
              router.replace("/(tabs)/home");
            } else {
              router.replace("/complete-profile");
            }
          }
        })
        .catch((error) => {
          console.error("Erro no login com Google Credential:", error);
          Alert.alert("Erro", "Não foi possível fazer login com o Google.");
        });
    }
  }, [response]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        Alert.alert(
          "Verificação de E-mail",
          "Seu e-mail ainda não foi verificado. Por favor, verifique sua caixa de entrada ou spam. Deseja reenviar o e-mail de confirmação?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Reenviar E-mail",
              onPress: async () => {
                try {
                  await sendEmailVerification(user);
                  Alert.alert("E-mail Enviado", "Um novo e-mail de confirmação foi enviado para " + user.email);
                } catch (error) {
                  console.error("Erro ao reenviar e-mail de verificação:", error);
                  Alert.alert("Erro", "Não foi possível reenviar o e-mail de confirmação.");
                }
              },
            },
          ]
        );
        return; // Impede o login até que o e-mail seja verificado
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().profileComplete) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/complete-profile");
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert("Erro", "Email ou senha incorretos.");
      } else if (error.code === 'auth/too-many-requests'){
        Alert.alert("Erro", "Muitas tentativas de login. Tente novamente mais tarde.");
      } else {
        Alert.alert("Erro", "Ocorreu um erro ao fazer login.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IndicaAi</Text>
      
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
        placeholder="Senha"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={() => promptAsync()}
        disabled={!request}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#007AFF",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  googleButton: {
    backgroundColor: "#DB4437",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  icon: {
    marginRight: 10,
  },
  linksContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "center",
  },
  link: {
    color: "#007AFF",
    fontSize: 14,
  },
  separator: {
    fontSize: 14,
    color: "#888",
  },
});
