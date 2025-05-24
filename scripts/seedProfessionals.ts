import { initializeApp } from "firebase/app";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import specialties from "../services/specialties"; // Usando import com export default

const firebaseConfig = {
  apiKey: "AIzaSyDH0uEw-Ml-66pUEHF1MWED7TbuhRIWHQ0",
  authDomain: "service-recommendation-app.firebaseapp.com",
  projectId: "service-recommendation-app",
  storageBucket: "service-recommendation-app.appspot.com",
  messagingSenderId: "859975350986",
  appId: "1:859975350986:web:830f7e110142f053041233"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const cidades = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre",
  "Salvador", "Brasília", "Recife", "Fortaleza", "Manaus"
];

const categorias = ["Reformas", "Limpeza", "Manutenção", "Serviços Gerais"];

// ✅ Corrigido: Tipagem explícita do parâmetro
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedProfessionals(qtd = 50) {
  for (let i = 1; i <= qtd; i++) {
    const nome = `Profissional ${i}`;
    const categoria = randomFrom(categorias);
    const cidade = randomFrom(cidades);
    const especialidade = randomFrom(specialties);
    const bio = `Bio de exemplo para o profissional ${i}.`;
    const userId = `testuser${i}`;

    await addDoc(collection(db, "professionals"), {
      userId,
      name: nome,
      category: categoria,
      specialty: especialidade,
      city: cidade,
      bio: bio,
      recommendationCount: Math.floor(Math.random() * 30),
      recommendedBy: [],
    });

    console.log(`Profissional ${i} criado.`);
  }

  console.log("População concluída!");
}

seedProfessionals(50);
