// src/lib/useAuth.ts
// Global auth hook — use this in any component to get current user + pro status

'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { getUserProfile, createUserProfile, UserProfile } from './userStore';

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Ensure profile doc exists
        await createUserProfile(u.uid, u.email ?? '', u.displayName ?? '');
        const p = await getUserProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      setProfile(p);
    }
  };

  return {
    user,
    profile,
    isPro: profile?.isPro ?? false,
    loading,
    refreshProfile,
  };
}