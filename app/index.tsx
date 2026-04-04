import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from "@react-native-google-signin/google-signin";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React from "react";
import { Controller, useForm } from "react-hook-form";
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
import * as yup from "yup";
import { auth, db } from "../services/firebase";

type FormData = { email: string; password: string };

export default function Login() {
  const router = useRouter();

  // ---- validação com yup ----
  const schema = yup.object({
    email: yup.string().email("E-mail inválido").required("E-mail é obrigatório"),
    password: yup
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .required("Senha é obrigatória"),
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { email: "", password: "" },
    resolver: async (data) => {
      try {
        const values = await schema.validate(data, { abortEarly: false });
        return { values, errors: {} };
      } catch (err) {
        const e = err as yup.ValidationError;
        const formErrors = e.inner.reduce<Record<string, any>>((acc, cur) => {
          if (!cur.path) return acc;
          acc[cur.path] = { type: cur.type ?? "validation", message: cur.message };
          return acc;
        }, {});
        return { values: {}, errors: formErrors };
      }
    },
  });

  // ---- Google Auth (Native Sign-In) ----
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        Alert.alert("Erro", "Não foi possível obter o token do Google.");
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const { user } = await signInWithCredential(auth, credential);

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && snap.data().profileComplete) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/complete-profile");
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert("Erro", "Google Play Services não está disponível ou precisa ser atualizado.");
          return;
        }
      }
      console.error("Erro ao fazer login com Google:", error);
      Alert.alert("Erro", "Não foi possível entrar com Google.");
    }
  };

  const handleLogin = async ({ email, password }: FormData) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && snap.data().profileComplete) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/complete-profile");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setError("password", {
        message: "Email ou senha incorretos. Por favor, tente novamente.",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>IndicaAi</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value} }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="E-mail"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          )}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Senha"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              style={styles.input}
            />
          )}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit(handleLogin)}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleLogin}>
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
    backgroundColor: "#1d3f5d",
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
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
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
  googleButtonText: { color: "black", fontSize: 16, fontWeight: "600" },
  icon: { marginRight: 8 },
  linksContainer: { flexDirection: "row", marginTop: 16 },
  link: { color: "#1976D2", fontWeight: "500" },
  separator: { marginHorizontal: 8, color: "#6B7280" },
  errorText: { alignSelf: "flex-start", color: "#f43f5e", marginBottom: 8 },
});
