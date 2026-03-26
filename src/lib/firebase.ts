import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Projeto confirmado pelo usuário
const PROJECT_ID = "project-60432d0d-fba5-4ea8-aaf";

// Configuração limpa e direta
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.replace(/['"]/g, '').trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.replace(/['"]/g, '').trim() || `${PROJECT_ID}.firebaseapp.com`,
  projectId: PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.replace(/['"]/g, '').trim() || `${PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.replace(/['"]/g, '').trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.replace(/['"]/g, '').trim(),
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID?.replace(/['"]/g, '').trim() || undefined,
};

// Log de depuração para ajudar a identificar se a chave está chegando vazia
console.log(
  "🔥 Firebase Status:", 
  firebaseConfig.apiKey ? `Chave carregada (Inicia com: ${firebaseConfig.apiKey.substring(0, 5)}...)` : "❌ NENHUMA CHAVE DE API ENCONTRADA",
  "| Projeto:", firebaseConfig.projectId
);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Inicialização moderna do Firestore com cache persistente
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
