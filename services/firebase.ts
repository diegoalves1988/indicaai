import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  initializeAuth, // Import GoogleAuthProvider
  sendEmailVerification, // Import sendEmailVerification
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDH0uEw-Ml-66pUEHF1MWED7TbuhRIWHQ0",
  authDomain: "service-recommendation-app.firebaseapp.com",
  projectId: "service-recommendation-app",
  storageBucket: "service-recommendation-app.appspot.com", // Corrigido conforme sugestão anterior
  messagingSenderId: "859975350986",
  appId: "1:859975350986:web:830f7e110142f053041233",
  measurementId: "G-WW074H965J",
};

// Inicializa o app
const app = initializeApp(firebaseConfig);

// Serviços Firebase
const db = getFirestore(app);
const storage = getStorage(app);

// Autenticação
const auth = Platform.OS === "web"
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });

// Provedor Google
const googleProvider = new GoogleAuthProvider();

// Exportar todos os serviços e o provedor
export { auth, db, googleProvider, sendEmailVerification, storage };

