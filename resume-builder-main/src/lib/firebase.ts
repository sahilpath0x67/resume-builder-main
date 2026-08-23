import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA-D_sAaDbljQ6ux1GTrlkTI2LKq6sDazs",
  authDomain: "resume-ananta.firebaseapp.com",
  projectId: "resume-ananta",
  storageBucket: "resume-ananta.firebasestorage.app",
  messagingSenderId: "1031384287425",
  appId: "1:1031384287425:web:475f4d801e55289d65ec40",
  measurementId: "G-RPZ7HYZQCM"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
