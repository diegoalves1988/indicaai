import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, increment, query, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase";

interface Professional {
  userId: string;
  name: string;
  category: string;
  specialties: string[];
  city: string;
  bio?: string;
  recommendationCount?: number;
  recommendedBy?: string[];
}

// ✅ Cadastra um profissional
export async function registerProfessional(professional: Professional) {
  try {
    const professionalRef = collection(db, "professionals");
    await addDoc(professionalRef, {
      ...professional,
      recommendationCount: 0,
      recommendedBy: [],
    });
  } catch (error) {
    console.error("Erro ao cadastrar profissional:", error);
    throw error;
  }
}

// ✅ Busca todos os profissionais cadastrados
export const getProfessionals = async () => {
  try {
    const professionalsRef = collection(db, "professionals");
    const querySnapshot = await getDocs(professionalsRef);

    const professionals: Professional[] = [];
    querySnapshot.forEach((doc) => {
      professionals.push({ id: doc.id, ...doc.data() } as Professional);
    });
    return professionals;
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    throw error;
  }
};

// Busca um profissional específico
export const getProfessionalById = async (id) => {
  if (!id) return null;
  const docRef = doc(db, "professionals", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

// Busca os profissionais recomendados pelo usuário
export async function getRecommendedProfessionalsByUser(userId: string) {
  const professionalsRef = collection(db, "professionals");
  const q = query(professionalsRef, where("recommendedBy", "array-contains", userId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ✅ Atualiza os dados de um profissional
export const updateProfessional = async (professionalId: string, updatedData: Partial<Professional>) => {
  try {
    const professionalRef = doc(db, "professionals", professionalId);
    await updateDoc(professionalRef, updatedData);
    console.log("Profissional atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error);
    throw error;
  }
};

// ✅ Exclui um profissional
export const deleteProfessional = async (professionalId: string) => {
  try {
    const professionalRef = doc(db, "professionals", professionalId);
    await deleteDoc(professionalRef);
    console.log("Profissional excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao excluir profissional:", error);
    throw error;
  }
};

// ✅ Adiciona uma recomendação
export const recommendProfessional = async (professionalId: string, userId: string) => {
  try {
    const professionalRef = doc(db, "professionals", professionalId);
    const professionalSnap = await getDoc(professionalRef);

    if (professionalSnap.exists()) {
      const professionalData = professionalSnap.data();

      // Se o usuário ainda não recomendou, adiciona a recomendação
      if (!professionalData.recommendedBy?.includes(userId)) {
        await updateDoc(professionalRef, {
          recommendedBy: arrayUnion(userId),
          recommendationCount: increment(1), // 🔄 Incrementa a contagem diretamente no Firestore
        });
      }
    }
  } catch (error) {
    console.error("Erro ao recomendar profissional:", error);
  }
};
  

// ✅ Remove uma recomendação
export async function removeRecommendation(professionalId: string, userId: string) {
  try {
    const professionalRef = doc(db, "professionals", professionalId);
    await updateDoc(professionalRef, {
      recommendationCount: increment(-1),
      recommendedBy: arrayRemove(userId),
    });
  } catch (error) {
    console.error("Erro ao remover recomendação:", error);
    throw error;
  }
}


// Remove o perfil profissional e suas recomendações
export async function deleteProfessionalProfile(userId: string) {
  // 1. Remover o documento do profissional
  const professionalsRef = collection(db, "professionals");
  const snapshot = await getDocs(professionalsRef);
  let profIdToDelete: string | null = null;
  snapshot.forEach((docSnap) => {
    if (docSnap.data().userId === userId) {
      profIdToDelete = docSnap.id;
    }
  });
  if (profIdToDelete) {
    await deleteDoc(doc(db, "professionals", profIdToDelete));
  }

  // 2. Remover recomendações deste profissional em outros usuários
  const usersRef = collection(db, "users");
  const usersSnap = await getDocs(usersRef);
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    if (data.recommendedProfessionals && Array.isArray(data.recommendedProfessionals)) {
      if (data.recommendedProfessionals.includes(userId)) {
        await updateDoc(doc(db, "users", userDoc.id), {
          recommendedProfessionals: arrayRemove(userId),
        });
      }
    }
  }
}
