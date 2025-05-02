import { db } from "./firebase";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from "firebase/firestore";

interface UserProfile {
  userId: string;
  name: string;
  phone: string;
  photoURL?: string; // 👈 Novo campo opcional
  address: {
    cep: string;  // ✅ Adicionado o campo CEP
    street: string;
    city: string;
    state: string;
    country: string;
  };
  friends?: string[];
}

// ✅ Cria um novo perfil de usuário no Firestore
export async function createUserProfile(user: UserProfile) {
    const userRef = doc(db, "users", user.userId);
    await setDoc(userRef, {
      ...user,
      friends: [], // Inicializa a lista de amigos vazia
    });
  }

  // ✅ Atualiza o perfil do usuário (caso ele edite as informações no futuro)
export async function updateUserProfile(userId: string, updatedData: Partial<UserProfile>) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, updatedData);
  console.log("Perfil atualizado com sucesso!");
}

// ✅ Obtém os dados do usuário
export async function getUserProfile(userId: string) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data();
  } else {
    console.warn(`Perfil do usuário ${userId} não encontrado.`);
    return null;  // Retorna null ao invés de gerar um erro
  }
}

// ✅ Adicionar amigo
export async function addFriend(userId: string, friendId: string) {
  if (userId === friendId) {
    throw new Error("Você não pode adicionar a si mesmo como amigo.");
  }

  const userRef = doc(db, "users", userId);
  const friendRef = doc(db, "users", friendId);

  // Verifica se os usuários existem antes de adicionar
  const userSnap = await getDoc(userRef);
  const friendSnap = await getDoc(friendRef);

  if (!userSnap.exists() || !friendSnap.exists()) {
    throw new Error("Usuário não encontrado.");
  }

  await updateDoc(userRef, {
    friends: arrayUnion(friendId),
  });

  await updateDoc(friendRef, {
    friends: arrayUnion(userId),
  });

  console.log("Amizade adicionada com sucesso!");
}

// ✅ Remover amigo
export async function removeFriend(userId: string, friendId: string) {
  try {
    console.log(`Iniciando remoção de amizade: ${userId} -> ${friendId}`);
    
    // Obter referências aos documentos
    const userRef = doc(db, "users", userId);
    const friendRef = doc(db, "users", friendId);

    // Criar um batch (lote) de operações
    const batch = writeBatch(db);

    // Remover o amigo da lista do usuário atual
    batch.update(userRef, {
      friends: arrayRemove(friendId)
    });

    // Remover o usuário atual da lista do amigo
    batch.update(friendRef, {
      friends: arrayRemove(userId)
    });

    // Executar todas as operações atomicamente
    await batch.commit();
    
    console.log("Amizade removida com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao remover amigo:", error);
    throw error;
  }
}

// ✅ Obter lista de amigos de um usuário
export async function getFriends(userId: string) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const friendsList = userData?.friends || [];

    // Buscar detalhes dos amigos
    const friendDetailsPromises = friendsList.map(async (friendId) => {
      const friendRef = doc(db, "users", friendId);
      const friendSnap = await getDoc(friendRef);
      return { id: friendId, name: friendSnap.data()?.name, photoURL: friendSnap.data()?.photoURL };
    });

    const friendsDetails = await Promise.all(friendDetailsPromises);
    return friendsDetails;
}


// Obter lista de amigos sugeridos
export async function getSuggestedFriends(userId: string) {
  const usersRef = collection(db, "users");
  const currentUser = await getDoc(doc(db, "users", userId));
  const currentFriends = currentUser.data()?.friends || [];
  
  return (await getDocs(usersRef)).docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user => 
      user.id !== userId && 
      !currentFriends.includes(user.id)
    );
}


