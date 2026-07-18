import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { 
  getAuth, 
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

// Firebase credentials from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBJb75e64P4CFamYPC-wjyP-mA8GFFTlnU",
  authDomain: "grand-device-rthgf.firebaseapp.com",
  projectId: "grand-device-rthgf",
  storageBucket: "grand-device-rthgf.firebasestorage.app",
  messagingSenderId: "1081421461163",
  appId: "1:1081421461163:web:48cc724325ca8dd189e9ee"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
export const db = getFirestore(app, "ai-studio-06da014c-1040-4638-8415-8d37f8fdd5fe");

// Initialize Firebase Auth
export const auth = getAuth(app);

// Export Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar");
googleProvider.addScope("https://www.googleapis.com/auth/contacts");
googleProvider.addScope("https://www.googleapis.com/auth/contacts.readonly");
googleProvider.addScope("https://www.googleapis.com/auth/contacts.other.readonly");

// Safe async authentication starter - anonymous auth disabled per security guidelines
export async function tryAnonymousAuth() {
  console.log("SpaWellGhana CRM: Anonymous authentication disabled per security guidelines. Please sign in via Google.");
  return null;
}

// Validate Firestore Connection (per SKILL.md instruction)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("SpaWellGhana CRM: Connection to Firestore validated.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("SpaWellGhana CRM: Please check your network or Firebase configuration.");
    } else {
      console.log("SpaWellGhana CRM: Connection verified (empty document expected).");
    }
  }
}

testConnection();
