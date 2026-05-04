import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export interface UserProfile {
  whatsappNumber?: string;
  onboardingCompleted?: boolean;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.id, 'config', 'profile');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile({});
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.id, 'config', 'profile');
    await setDoc(docRef, data, { merge: true });
    setProfile(prev => ({ ...prev, ...data }));
  };

  return { profile, updateProfile, loading };
}
