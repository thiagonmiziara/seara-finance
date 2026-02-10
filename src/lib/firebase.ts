import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCwkhCJv8II2F6GYOHjWGXezuPym3pcf8Y",
    authDomain: "seara-finance.firebaseapp.com",
    projectId: "seara-finance",
    storageBucket: "seara-finance.firebasestorage.app",
    messagingSenderId: "210838502127",
    appId: "1:210838502127:web:f57042ca6ff5b97d3b791a",
    measurementId: "G-Y7BTVD6VE9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});
