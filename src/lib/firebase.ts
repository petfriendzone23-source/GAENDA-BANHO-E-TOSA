import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCb8lIwlIZliEbraTicgNQn3JVFfqNoSok",
  authDomain: "dados-agenda-d02f6.firebaseapp.com",
  projectId: "dados-agenda-d02f6",
  storageBucket: "dados-agenda-d02f6.firebasestorage.app",
  messagingSenderId: "271597869424",
  appId: "1:271597869424:web:48dbe80e88f107c65597b5",
  measurementId: "G-TSYHKLQLP2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Habilita persistência offline
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistência falhou: múltiplas abas abertas.');
    } else if (err.code === 'unimplemented') {
      console.warn('O navegador não suporta persistência.');
    }
  });
}
