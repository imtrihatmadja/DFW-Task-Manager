import { create } from 'zustand';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, Role } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
}));

// Initialize auth listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    useAuthStore.getState().setUser(user);
    
    // Fetch or create user profile
    const userRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const profileData = userSnap.data() as UserProfile;
        
        // Auto-promote admin@dfw.or.id to admin role
        if (user.email === 'admin@dfw.or.id' && profileData.role !== 'admin') {
          profileData.role = 'admin';
          try {
            await updateDoc(userRef, { role: 'admin' });
          } catch (error) {
            console.error("Error auto-promoting to admin:", error);
          }
        }
        
        useAuthStore.getState().setProfile(profileData);
      } else {
        // Create new user profile with default role 'field_officer'
        const role: Role = user.email === 'admin@dfw.or.id' ? 'admin' : 'field_officer';
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL,
          role: role,
          createdAt: Date.now(),
        };
        
        try {
          await setDoc(userRef, newProfile);
        } catch (error) {
          console.warn("Could not save user profile to Firestore (client may be offline):", error);
        }
        useAuthStore.getState().setProfile(newProfile);
      }
    } catch (error) {
      console.warn("Firestore user profile fetch failed (offline/unavailable), using fallback profile:", error);
      const role: Role = user.email === 'admin@dfw.or.id' ? 'admin' : 'field_officer';
      useAuthStore.getState().setProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL,
        role: role,
        createdAt: Date.now(),
      });
    }
  } else {
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setProfile(null);
  }
  
  useAuthStore.setState({ loading: false, initialized: true });
});
