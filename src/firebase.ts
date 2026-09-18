import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBNxKJbN9XoKCEK2FqBPEXbz4xA8ehrYQI",
  authDomain: "monopoli-by-degia.firebaseapp.com",
  projectId: "monopoli-by-degia",
  storageBucket: "monopoli-by-degia.firebasestorage.app",
  messagingSenderId: "259805169405",
  appId: "1:259805169405:web:38a2de2bc2b1b3b16de094",
  measurementId: "G-44XN1LQMCV",
  // URL Realtime Database — sesuaikan jika berbeda setelah create di console
  databaseURL: "https://monopoli-by-degia-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
