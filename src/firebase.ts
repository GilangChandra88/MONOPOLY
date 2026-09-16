import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNxKJbN9XoKCEK2FqBPEXbz4xA8ehrYQI",
  authDomain: "monopoli-by-degia.firebaseapp.com",
  projectId: "monopoli-by-degia",
  storageBucket: "monopoli-by-degia.firebasestorage.app",
  messagingSenderId: "259805169405",
  appId: "1:259805169405:web:38a2de2bc2b1b3b16de094",
  measurementId: "G-44XN1LQMCV"
};

const app = initializeApp(firebaseConfig);

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const googleProvider = new GoogleAuthProvider();
