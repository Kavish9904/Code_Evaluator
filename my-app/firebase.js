// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, getDocs, query, where, orderBy } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHI3KMHb-QZm2Rt9q1u3AZTpylAlW0UEU",
  authDomain: "my-app-596bd.firebaseapp.com",
  projectId: "my-app-596bd",
  storageBucket: "my-app-596bd.firebasestorage.app",
  messagingSenderId: "637652045525",
  appId: "1:637652045525:web:f4ce85e4c0b888a17fdc5c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, doc, getDoc, setDoc, onSnapshot, collection, getDocs, query, where, orderBy };
export default app;