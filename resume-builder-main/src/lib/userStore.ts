// src/lib/userStore.ts
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { ResumeOutput, FormData } from './types';

export interface SavedCV {
  id: string;
  name: string;
  resume: ResumeOutput;
  formData?: FormData; // ← stores the editable form so Load restores the form too
  coverLetter?: string;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isPro: boolean;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  createdAt: number;
  cvs: SavedCV[];
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter(item => item !== undefined).map(stripUndefined) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)])
    ) as T;
  }

  return value;
}

export async function createUserProfile(uid: string, email: string, displayName: string) {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { uid, email, displayName, isPro: false, createdAt: Date.now(), cvs: [] });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function saveCV(uid: string, cv: SavedCV) {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const profile  = snap.data() as UserProfile;
  const existing = profile.cvs || [];
  const idx      = existing.findIndex((c: SavedCV) => c.id === cv.id);
  const savedCV  = stripUndefined({ ...cv, updatedAt: Date.now() });
  let updated: SavedCV[];
  if (idx >= 0) {
    updated = [...existing];
    updated[idx] = savedCV;
  } else {
    updated = [...existing, savedCV];
  }
  await updateDoc(ref, { cvs: stripUndefined(updated) });
}

export async function deleteCV(uid: string, cvId: string) {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const profile = snap.data() as UserProfile;
  const updated = (profile.cvs || []).filter((c: SavedCV) => c.id !== cvId);
  await updateDoc(ref, { cvs: updated });
}

export async function setUserPro(uid: string, isPro: boolean, subscriptionId?: string, stripeCustomerId?: string) {
  await updateDoc(doc(db, 'users', uid), {
    isPro,
    subscriptionId:     subscriptionId     ?? null,
    stripeCustomerId:   stripeCustomerId   ?? null,
    subscriptionStatus: isPro ? 'active' : 'canceled',
  });
}
