import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // 👈 Importe o Storage
import { Platform } from 'react-native';

// Configuração do Firebase (mantenha a mesma)
const firebaseConfig = {
  apiKey: 'AIzaSyDH0uEw-Ml-66pUEHF1MWED7TbuhRIWHQ0',
  authDomain: 'service-recommendation-app.firebaseapp.com',
  projectId: 'service-recommendation-app',
  storageBucket: 'service-recommendation-app.firebasestorage.app', // 👈 Verifique se está correto
  messagingSenderId: '859975350986',
  appId: '1:859975350986:web:830f7e110142f053041233',
  measurementId: 'G-WW074H965J',
};

// Inicializa o app
const app = initializeApp(firebaseConfig);

// Serviços Firebase
const db = getFirestore(app);
const storage = getStorage(app); // 👈 Inicialize o Storage

// Autenticação (mantenha igual)
const auth = Platform.OS === 'web' 
  ? getAuth(app) 
  : initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });

// Exporte todos os serviços
export { auth, db, storage }; // 👈 Adicione storage
