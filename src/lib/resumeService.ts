import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { auth } from './firebase';

export async function saveResume(resumeData: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in to save resume");

  const resumesRef = collection(db, 'users', user.uid, 'resumes');

  const docRef = await addDoc(resumesRef, {
    ...resumeData,
    userId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// Optional: Update existing resume
export async function updateResume(resumeId: string, resumeData: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const resumeRef = doc(db, 'users', user.uid, 'resumes', resumeId);
  await updateDoc(resumeRef, {
    ...resumeData,
    updatedAt: serverTimestamp(),
  });
}
