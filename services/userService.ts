import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc, // Adicionado setDoc para createUserProfile
  getDocs,
  setDoc,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage"; // Adicionado para Firebase Storage
import { db, storage } from "./firebase"; // Adicionado storage

interface UserProfile {
  userId: string;
  name: string;
  phone: string;
  photoURL?: string | null; // Permitir null para remoção
  address: {
    cep: string;
    street: string;
    city: string;
    state: string;
    country: string;
  };
  friends?: string[];
  professionalProfile?: boolean; // Adicionado para consistência com user-profile.tsx
}

// ✅ Cria um novo perfil de usuário no Firestore
export async function createUserProfile(user: UserProfile) {
    const userRef = doc(db, "users", user.userId);
    // Usar setDoc para criar ou sobrescrever completamente o documento
    await setDoc(userRef, {
      ...user,
      photoURL: user.photoURL || null, // Garante que photoURL seja null se não fornecido
      friends: [], // Inicializa a lista de amigos vazia
      professionalProfile: user.professionalProfile || false, // Garante valor default
    });
  }

// ✅ Atualiza o perfil do usuário
export async function updateUserProfile(userId: string, updatedData: Partial<UserProfile>) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, updatedData);
  console.log("Perfil atualizado com sucesso!");
}

// ✅ Upload da imagem de perfil para o Firebase Storage e retorna a URL de download
export async function uploadProfileImage(userId: string, imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profile_images/${userId}/profile.jpg`);
    
    // Deleta a imagem antiga, se existir, para evitar acúmulo de arquivos não utilizados
    try {
      await getDownloadURL(storageRef); // Verifica se o arquivo existe
      await deleteObject(storageRef); // Deleta o arquivo antigo
      console.log("Imagem de perfil antiga removida.");
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        // Nenhuma imagem antiga para remover, o que é normal
        console.log("Nenhuma imagem de perfil antiga encontrada para remover.");
      } else {
        // Outro erro ao tentar verificar/deletar a imagem antiga
        console.warn("Erro ao verificar/remover imagem de perfil antiga:", error);
      }
    }

    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progresso do upload (opcional)
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload está " + progress + "% concluído");
        },
        (error) => {
          console.error("Erro no upload da imagem de perfil:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("Imagem de perfil enviada, URL:", downloadURL);
          // Atualiza o photoURL no Firestore
          await updateUserProfile(userId, { photoURL: downloadURL });
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error("Erro ao preparar upload da imagem:", error);
    throw error;
  }
}

// ✅ Remove a imagem de perfil do Firebase Storage e do Firestore
export async function removeProfileImage(userId: string): Promise<void> {
  try {
    const storageRef = ref(storage, `profile_images/${userId}/profile.jpg`);
    // Deleta a imagem do Storage
    await deleteObject(storageRef);
    console.log("Imagem de perfil removida do Storage.");
    // Remove/anula o photoURL no Firestore
    await updateUserProfile(userId, { photoURL: null });
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.log("Nenhuma imagem de perfil encontrada no Storage para remover.");
      // Mesmo se não houver no storage, garante que no Firestore esteja nulo
      await updateUserProfile(userId, { photoURL: null });
    } else {
      console.error("Erro ao remover imagem de perfil:", error);
      throw error;
    }
  }
}

// ✅ Obtém os dados do usuário
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    console.warn(`Perfil do usuário ${userId} não encontrado.`);
    return null;
  }
}

// ✅ Adicionar amigo
export async function addFriend(userId: string, friendId: string) {
  if (userId === friendId) {
    throw new Error("Você não pode adicionar a si mesmo como amigo.");
  }

  const userRef = doc(db, "users", userId);
  const friendRef = doc(db, "users", friendId);

  const userSnap = await getDoc(userRef);
  const friendSnap = await getDoc(friendRef);

  if (!userSnap.exists() || !friendSnap.exists()) {
    throw new Error("Usuário não encontrado.");
  }

  const batch = writeBatch(db);
  batch.update(userRef, { friends: arrayUnion(friendId) });
  batch.update(friendRef, { friends: arrayUnion(userId) });
  await batch.commit();

  console.log("Amizade adicionada com sucesso!");
}

// ✅ Remover amigo
export async function removeFriend(userId: string, friendId: string) {
  try {
    const userRef = doc(db, "users", userId);
    const friendRef = doc(db, "users", friendId);

    const batch = writeBatch(db);
    batch.update(userRef, { friends: arrayRemove(friendId) });
    batch.update(friendRef, { friends: arrayRemove(userId) });
    await batch.commit();
    
    console.log("Amizade removida com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao remover amigo:", error);
    throw error;
  }
}

// ✅ Obter lista de amigos de um usuário
export async function getFriends(userId: string): Promise<{ id: string; name?: string; photoURL?: string | null }[]> {
  const userProfile = await getUserProfile(userId);
  const friendsList = userProfile?.friends || [];

  if (friendsList.length === 0) return [];

  const friendDetailsPromises = friendsList.map(async (friendId) => {
    const friendProfile = await getUserProfile(friendId);
    return {
      id: friendId,
      name: friendProfile?.name,
      photoURL: friendProfile?.photoURL,
    };
  });

  return Promise.all(friendDetailsPromises);
}

// Obter lista de amigos sugeridos
export async function getSuggestedFriends(userId: string): Promise<UserProfile[]> {
  const usersRef = collection(db, "users");
  const currentUserProfile = await getUserProfile(userId);
  const currentFriends = currentUserProfile?.friends || [];

  const querySnapshot = await getDocs(usersRef);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
    .filter(profile => 
      profile.id !== userId && // Corrigido para usar 'id' em vez de 'userId'
      !currentFriends.includes(profile.id) // Certifique-se de usar 'id' aqui também
    );
}

