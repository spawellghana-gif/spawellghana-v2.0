import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, getDoc, serverTimestamp, initializeFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJb75e64P4CFamYPC-wjyP-mA8GFFTlnU",
  authDomain: "grand-device-rthgf.firebaseapp.com",
  projectId: "grand-device-rthgf",
  storageBucket: "grand-device-rthgf.firebasestorage.app",
  messagingSenderId: "1081421461163",
  appId: "1:1081421461163:web:48cc724325ca8dd189e9ee"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const auth = getAuth(app);

// ... rest of the code ...
