import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHI3KMHb-QZm2Rt9q1u3AZTpylAlW0UEU",
  authDomain: "my-app-596bd.firebaseapp.com",
  projectId: "my-app-596bd",
  storageBucket: "my-app-596bd.firebasestorage.app",
  messagingSenderId: "637652045525",
  appId: "1:637652045525:web:f4ce85e4c0b888a17fdc5c",
};

// Debug log to verify config
console.log("Firebase config values:", {
  apiKey: !!firebaseConfig.apiKey,
  projectId: !!firebaseConfig.projectId,
  authDomain: !!firebaseConfig.authDomain,
});

// Initialize Firebase with hardcoded config
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

console.log("Firebase initialized");
