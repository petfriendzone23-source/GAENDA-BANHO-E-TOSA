import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCb8lIwlIZliEbraTicgNQn3JVFfqNoSok",
  authDomain: "dados-agenda-d02f6.firebaseapp.com",
  projectId: "dados-agenda-d02f6",
  storageBucket: "dados-agenda-d02f6.appspot.com",
  messagingSenderId: "271597869424",
  appId: "1:271597869424:web:48dbe80e88f107c65597b5",
  measurementId: "G-TSYHKLQLP2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Inicialização moderna do Firestore com cache persistente
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
