import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCx22ij8s6jo0CSsY48maGc71HSRSoKBxg",
  authDomain: "jaxx-micro-saas.firebaseapp.com",
  projectId: "jaxx-micro-saas",
  storageBucket: "jaxx-micro-saas.firebasestorage.app",
  messagingSenderId: "985828152645",
  appId: "1:985828152645:web:9181e90b94c8b2fe5ada2c",
  measurementId: "G-C8575SJS0B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Services
export const employeeCollection = collection(db, 'employees');
