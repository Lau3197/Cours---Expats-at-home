import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-l53RiwCiEKXvWDLwXmEAMqaYWbbyRTU",
  authDomain: "cours-a1-b2.firebaseapp.com",
  projectId: "cours-a1-b2",
  storageBucket: "cours-a1-b2.firebasestorage.app",
  messagingSenderId: "580711237544",
  appId: "1:580711237544:web:5e3821dee7b252fb1b7f9d",
  measurementId: "G-RLE1LXB7H0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, googleProvider };

