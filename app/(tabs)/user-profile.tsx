import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { deleteUser, signOut } from "firebase/auth";
import { arrayRemove, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaskInput from "react-native-mask-input";
import UserAvatar from "../../components/UserAvatar";
import { useAuth } from "../../hooks/useAuth";
import { auth, db } from "../../services/firebase";
import { deleteProfessionalProfile } from "../../services/professionalService";
import { getUserProfile, removeProfileImage, updateUserProfile, uploadProfileImage } from "../../services/userService";

function UserProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null | undefined>(undefined);
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [country, setCountry] = useState("");
  const [isProfessional, setIsProfessional] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadUserData = async () => {
      setLoading(true);
      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setName(userProfile.name || "");
          setPhone(userProfile.phone || "");
          setPhotoURL(userProfile.photoURL || null);
          setIsProfessional(userProfile.professionalProfile || false);
          const address = userProfile.address || {};
          setCep(address.cep || "");
          setStreet(address.street || "");
          setCity(address.city || "");
          setStateValue(address.state || "");
          setCountry(address.country || "");
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        Alert.alert("Erro", "Erro ao carregar os dados do usuário.");
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [user]);

  const fetchAddressFromCep = async (rawCep: string) => {
    const numericCep = rawCep.replace(/\D/g, "");
    if (numericCep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        Alert.alert("CEP não encontrado", "Por favor, verifique o CEP digitado.");
        return;
      }
      setStreet(data.logradouro || "");
      setCity(data.localidade || "");
      setStateValue(data.uf || "");
      setCountry("Brasil");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível buscar o endereço pelo CEP.");
    }
  };

  const handleCepChange = (formatted: string, extracted?: string) => {
    setCep(formatted);
    if (extracted && extracted.length === 8) {
      fetchAddressFromCep(extracted);
    }
  };

  const handlePhoneChange = (formatted: string, extracted?: string) => {
    setPhone(formatted);
  };

  const handleSave = async () => {
    if (!user) return;
    const address = { cep, street, city, state: stateValue, country };
    try {
      setSaving(true);
      await updateUserProfile(user.uid, { name, phone, address });
      Alert.alert("Sucesso", "Dados atualizados com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const navigateToEditProfessionalProfile = () => {
    router.push("/edit-professional-profile");
  };

  const processAndUploadImage = async (source: string | Blob) => {
    if (!user) return;
    setUploadingImage(true);
    try {
      const newPhotoURL = await uploadProfileImage(user.uid, source);
      setPhotoURL(newPhotoURL);
      Alert.alert("Sucesso", "Foto de perfil atualizada!");
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      Alert.alert("Erro", "Não foi possível alterar a foto de perfil.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageSelectionFromLibrary = async () => {
    if (Platform.OS === "web") {
      fileInputRef.current?.click(); // Aciona o input de arquivo para web
      return;
    }
    // Lógica para Mobile (iOS/Android)
    try {
      const libPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libPermission.granted) {
        Alert.alert("Permissão Necessária", "Precisamos de acesso à galeria para escolher uma foto.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndUploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem da galeria (mobile):", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem.");
    }
  };
  
  const handleImageSelectionFromCamera = async () => {
    if (Platform.OS === "web") { // Câmera não é suportada via ImagePicker no web
        Alert.alert("Funcionalidade não disponível", "A captura de foto pela câmera não é suportada no navegador.");
        return;
    }
    // Lógica para Mobile (iOS/Android)
    try {
        const camPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPermission.granted) {
            Alert.alert("Permissão Necessária", "Precisamos de acesso à câmera para tirar uma foto.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            await processAndUploadImage(result.assets[0].uri);
        }
    } catch (error) {
        console.error("Erro ao capturar imagem da câmera (mobile):", error);
        Alert.alert("Erro", "Não foi possível capturar a imagem.");
    }
  };

  const handleFileSelectedForWeb = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processAndUploadImage(file);
    }
     // Limpa o valor do input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    Alert.alert("Remover Foto", "Tem certeza que deseja remover sua foto de perfil?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setUploadingImage(true);
          try {
            await removeProfileImage(user.uid);
            setPhotoURL(null);
            Alert.alert("Sucesso", "Foto de perfil removida.");
          } catch (error) {
            console.error("Erro ao remover foto:", error);
            Alert.alert("Erro", "Não foi possível remover a foto.");
          } finally {
            setUploadingImage(false);
          }
        },
      },
    ]);
  };

  const showImageOptions = () => {
    if (Platform.OS === "web") {
      if (photoURL && typeof window !== "undefined") {
        const shouldRemove = window.confirm(
          "Deseja remover a foto de perfil atual? Clique em 'Cancelar' para escolher uma nova imagem."
        );
        if (shouldRemove) {
          handleRemovePhoto();
          return;
        }
      }
      handleImageSelectionFromLibrary();
      return;
    }

    const options = ["Escolher da Galeria"];
    if (Platform.OS !== "web") {
      options.unshift("Tirar Foto");
    }
    if (photoURL) {
      options.push("Remover Foto");
    }
    options.push("Cancelar");

    const destructiveButtonIndex = photoURL ? options.indexOf("Remover Foto") : -1;
    const cancelButtonIndex = options.indexOf("Cancelar");

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex, cancelButtonIndex },
        (buttonIndex) => {
          if (options[buttonIndex] === "Tirar Foto") handleImageSelectionFromCamera();
          else if (options[buttonIndex] === "Escolher da Galeria") handleImageSelectionFromLibrary();
          else if (options[buttonIndex] === "Remover Foto") handleRemovePhoto();
        }
      );
    } else {
      const alertOptions: any[] = [];
      if (Platform.OS !== "web") {
        alertOptions.push({ text: "Tirar Foto", onPress: () => handleImageSelectionFromCamera() });
      }
      alertOptions.push({ text: "Escolher da Galeria", onPress: () => handleImageSelectionFromLibrary() });
      if (photoURL) {
        alertOptions.push({ text: "Remover Foto", onPress: handleRemovePhoto, style: "destructive" });
      }
      alertOptions.push({ text: "Cancelar", style: "cancel" });
      Alert.alert("Alterar Foto de Perfil", "Escolha uma opção:", alertOptions);
    }
  };

  const handleDeleteProfessionalProfile = async () => {
    if (!user) return;
    Alert.alert(
      "Remover Perfil Profissional",
      "Tem certeza que deseja excluir seu perfil profissional? Essa ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove o perfil profissional e atualiza o usuário
              await deleteProfessionalProfile(user.uid);

              // Atualiza o campo professionalProfile do usuário para false
              await updateDoc(doc(db, "users", user.uid), {
                professionalProfile: false,
              });

              Alert.alert("Sucesso", "Perfil profissional removido.");
              // Atualize o estado local imediatamente
              setIsProfessional(false);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover o perfil profissional.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    Alert.alert(
      "Excluir Conta",
      "Tem certeza que deseja excluir sua conta? Todos os seus dados serão removidos e esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Remove perfil profissional se existir
              await deleteProfessionalProfile(user.uid);

              // 2. Remove usuário da lista de amigos e recomendações de outros usuários
              const usersRef = collection(db, "users");
              const usersSnap = await getDocs(usersRef);
              for (const userDoc of usersSnap.docs) {
                const data = userDoc.data();
                // Remove da lista de amigos
                if (data.friends && Array.isArray(data.friends)) {
                  if (data.friends.includes(user.uid)) {
                    await updateDoc(doc(db, "users", userDoc.id), {
                      friends: arrayRemove(user.uid),
                    });
                  }
                }
                // Remove da lista de recomendados
                if (data.recommendedProfessionals && Array.isArray(data.recommendedProfessionals)) {
                  if (data.recommendedProfessionals.includes(user.uid)) {
                    await updateDoc(doc(db, "users", userDoc.id), {
                      recommendedProfessionals: arrayRemove(user.uid),
                    });
                  }
                }
              }

              // 3. Remove documento do usuário
              await deleteDoc(doc(db, "users", user.uid));

              // 4. Remove autenticação do usuário
              await deleteUser(user);

              // 5. Desloga e redireciona
              await signOut(auth);
              Alert.alert("Conta excluída", "Sua conta foi removida com sucesso.");
              router.replace("/");
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível excluir a conta.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {Platform.OS === "web" && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleFileSelectedForWeb}
        />
      )}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={showImageOptions} disabled={uploadingImage}>
          <UserAvatar photoURL={photoURL} name={name} size={100} />
          {uploadingImage && <ActivityIndicator style={styles.avatarLoading} size="small" />}
        </TouchableOpacity>
        <Text style={styles.userName}>{name || "Usuário"}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, uploadingImage && styles.buttonDisabled]}
        onPress={showImageOptions}
        disabled={uploadingImage}
      >
        <Text style={styles.buttonText}>Alterar Foto</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Informações Pessoais</Text>
      <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
      <MaskInput
        style={styles.input}
        placeholder="Telefone"
        value={phone}
        onChangeText={handlePhoneChange}
        mask={["(", /\d/, /\d/, ")", " ", /\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
        keyboardType="phone-pad"
      />

      <Text style={styles.sectionTitle}>Endereço</Text>
      <MaskInput
        style={styles.input}
        placeholder="CEP"
        value={cep}
        onChangeText={handleCepChange}
        mask={[/\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/]}
        keyboardType="numeric"
      />
      <TextInput style={styles.input} placeholder="Rua" value={street} onChangeText={setStreet} />
      <TextInput style={styles.input} placeholder="Cidade" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Estado" value={stateValue} onChangeText={setStateValue} />
      <TextInput style={styles.input} placeholder="País" value={country} onChangeText={setCountry} />

      <TouchableOpacity
        style={[styles.button, (saving || uploadingImage) && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving || uploadingImage}
      >
        <Text style={styles.buttonText}>{saving ? "Salvando..." : "Salvar Alterações Pessoais"}</Text>
      </TouchableOpacity>

      {isProfessional && (
        <>
          <TouchableOpacity
            style={[styles.button, styles.professionalButton]}
            onPress={navigateToEditProfessionalProfile}
          >
            <Text style={[styles.buttonText, { color: "#fff" }]}>Editar Perfil Profissional</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeleteProfessionalProfile}
          >
            <Text style={styles.buttonText}>Excluir Perfil Profissional</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[styles.button, styles.deleteAccountButton]}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.buttonText}>Excluir Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarLoading: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#1d3f5d", // primary blue
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 10,
    color: "#1d3f5d", // primary blue
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1d3f5d", // primary blue
    borderRadius: 8,
    padding: Platform.OS === "ios" ? 12 : 10,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#1C1C1E",
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  button: {
    backgroundColor: "#1d3f5d",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 15,
    marginBottom: 5,
  },
  buttonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#DC3545",
    marginTop: 5,
  },
  professionalButton: {
    backgroundColor: "#1d3f5d",
  },
  deleteAccountButton: {
    backgroundColor: "#DC3545",
    marginTop: 20,
  },
});

export default UserProfileScreen;