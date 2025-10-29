import { deleteUser } from "firebase/auth";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc, // Adicionado setDoc para createUserProfile
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage"; // Adicionado para Firebase Storage
import { Platform } from "react-native";
import { db, storage } from "./firebase"; // Adicionado storage
import { deleteProfessionalProfile } from "./professionalService";

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
  favorites?: string[]; // Adicionado para favoritos
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
      favorites: [], // Inicializa a lista de favoritos vazia
    });
  }

// ✅ Atualiza o perfil do usuário
export async function updateUserProfile(userId: string, updatedData: Partial<UserProfile>) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, updatedData);
  console.log("Perfil atualizado com sucesso!");
}

// ✅ Upload da imagem de perfil para o Firebase Storage e retorna a URL de download
export async function uploadProfileImage(userId: string, imageSource: string | Blob): Promise<string> {
  try {
    console.log("[uploadProfileImage] userId:", userId);
    console.log("[uploadProfileImage] imageSource:", typeof imageSource === "string" ? imageSource : imageSource.type);

    let blob: Blob;
    if (typeof imageSource === "string") {
      const response = await fetch(imageSource);
      blob = await response.blob();
    } else {
      blob = imageSource;
    }

    console.log("[uploadProfileImage] blob criado, tamanho:", blob.size);
    const storageRef = ref(storage, `profile_pics/${userId}/profile.jpg`);

    // Deleta a imagem antiga, se existir, para evitar acúmulo de arquivos não utilizados
    if (Platform.OS !== "web") {
      try {
        await getDownloadURL(storageRef); // Verifica se o arquivo existe
        await deleteObject(storageRef); // Deleta o arquivo antigo
        console.log("Imagem de perfil antiga removida.");
      } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
          console.log("Nenhuma imagem de perfil antiga encontrada para remover.");
        } else {
          console.warn("Erro ao verificar/remover imagem de perfil antiga:", error);
        }
      }
    }

    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: blob.type || "image/jpeg",
    });
    console.log("[uploadProfileImage] upload iniciado para:", storageRef.fullPath);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`[uploadProfileImage] Progresso: ${progress}%`);
        },
        (error) => {
          // Log detalhado do erro
          console.error("Erro no upload da imagem de perfil:", error, error?.serverResponse);
          reject(error);
        },
        async () => {
          const { metadata } = uploadTask.snapshot;
          const downloadTokens = (metadata as Record<string, any>)?.downloadTokens;
          let downloadURL: string;

          if (downloadTokens) {
            downloadURL = `https://firebasestorage.googleapis.com/v0/b/${metadata.bucket}/o/${encodeURIComponent(
              metadata.fullPath
            )}?alt=media&token=${downloadTokens}`;
            console.log("[uploadProfileImage] URL construída a partir do metadata.");
          } else {
            downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("[uploadProfileImage] URL obtida via getDownloadURL.");
          }

          console.log("[uploadProfileImage] Upload finalizado. URL:", downloadURL);
          await updateUserProfile(userId, { photoURL: downloadURL });
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error("[uploadProfileImage] Erro ao preparar upload da imagem:", error);
    throw error;
  }
}

// ✅ Remove a imagem de perfil do Firebase Storage e do Firestore
export async function removeProfileImage(userId: string): Promise<void> {
  try {
    const storageRef = ref(storage, `profile_pics/${userId}/profile.jpg`);
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

// Obter lista de amigos sugeridos com paginação
export async function getSuggestedFriends(
  userId: string,
  limitNumber = 10,
  startAfterId?: string
): Promise<UserProfile[]> {
  const usersRef = collection(db, "users");
  const currentUserProfile = await getUserProfile(userId);
  const currentFriends = currentUserProfile?.friends || [];

  // Firestore "not-in" aceita no máximo 10 valores
  const excludedIds = [userId, ...currentFriends].slice(0, 10);

  let q = query(
    usersRef,
    where("userId", "not-in", excludedIds),
    orderBy("userId"),
    limit(limitNumber)
  );
  if (startAfterId) {
    q = query(q, startAfter(startAfterId));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((doc) => ({ userId: doc.id, ...doc.data() } as UserProfile))
    .filter(
      (profile) =>
        profile.userId !== userId && !currentFriends.includes(profile.userId)
    );
}

// Envia notificação de recomendação para o profissional recomendado
export async function sendRecommendationNotification({
  toUserId,
  fromUserId,
  professionalId,
}: {
  toUserId: string;
  fromUserId: string;
  professionalId: string;
}) {
  await addDoc(collection(db, "notifications"), {
    toUserId,
    fromUserId,
    professionalId,
    type: "recommendation",
    createdAt: serverTimestamp(),
    read: false,
  });
}

// Exclui completamente a conta do usuário, incluindo autenticação
export async function deleteUserAccount(user: any) {
  const userId = user.uid;
  // 1. Remove perfil profissional se existir
  await deleteProfessionalProfile(userId);

  // 2. Remove usuário da lista de amigos e recomendações de outros usuários
  const usersRef = collection(db, "users");
  const usersSnap = await getDocs(usersRef);
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    // Remove da lista de amigos
    if (data.friends && Array.isArray(data.friends)) {
      if (data.friends.includes(userId)) {
        await updateDoc(doc(db, "users", userDoc.id), {
          friends: arrayRemove(userId),
        });
      }
    }
    // Remove da lista de recomendados
    if (data.recommendedProfessionals && Array.isArray(data.recommendedProfessionals)) {
      if (data.recommendedProfessionals.includes(userId)) {
        await updateDoc(doc(db, "users", userDoc.id), {
          recommendedProfessionals: arrayRemove(userId),
        });
      }
    }
  }

  // 3. Remove documento do usuário
  await deleteDoc(doc(db, "users", userId));

  // 4. Remove autenticação do usuário
  await deleteUser(user);
}

// ✅ Adiciona um profissional aos favoritos do usuário
export async function addFavorite(userId: string, professionalId: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { favorites: arrayUnion(professionalId) });
  console.log(`Profissional ${professionalId} adicionado aos favoritos de ${userId}`);
}

// ✅ Remove um profissional dos favoritos do usuário
export async function removeFavorite(userId: string, professionalId: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { favorites: arrayRemove(professionalId) });
  console.log(`Profissional ${professionalId} removido dos favoritos de ${userId}`);
}

// ✅ Obtém a lista de IDs de profissionais favoritados pelo usuário
export async function getFavorites(userId: string): Promise<string[]> {
  const userProfile = await getUserProfile(userId);
  return userProfile?.favorites || [];
}

