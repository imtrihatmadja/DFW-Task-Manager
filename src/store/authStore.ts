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
  loginAsDemo: (role?: Role, email?: string, name?: string) => void;
  logout: () => Promise<void>;
}

const DEMO_USER_KEY = 'dfw_demo_session';

const getStoredDemoSession = (): { user: User; profile: UserProfile } | null => {
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialSession = getStoredDemoSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialSession ? initialSession.user : null,
  profile: initialSession ? initialSession.profile : null,
  loading: !initialSession,
  initialized: !!initialSession,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  loginAsDemo: (role: Role = 'admin', email?: string, name?: string) => {
    const effectiveEmail = email || (role === 'field_officer' ? 'dewi.lestari@dfw.or.id' : (role === 'project_coordinator' ? 'budi.santoso@dfw.or.id' : 'admin@dfw.or.id'));
    const effectiveName = name || (role === 'field_officer' ? 'Dewi Lestari (Field Officer)' : (role === 'project_coordinator' ? 'Budi Santoso (Project Coordinator)' : 'Admin DFW (Koordinator Nasional)'));
    const effectiveUid = role === 'field_officer' ? 'officer-1' : (role === 'project_coordinator' ? 'coordinator-1' : 'admin');

    const demoUser = {
      uid: effectiveUid,
      email: effectiveEmail,
      displayName: effectiveName,
      photoURL: null,
    } as unknown as User;

    const demoProfile: UserProfile = {
      uid: effectiveUid,
      email: effectiveEmail,
      displayName: effectiveName,
      photoURL: null,
      role: role,
      createdAt: Date.now() - 30 * 24 * 3600 * 1000,
    };

    try {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ user: demoUser, profile: demoProfile }));
    } catch (e) {
      console.warn("Could not persist demo session to localStorage", e);
    }

    set({ user: demoUser, profile: demoProfile, loading: false, initialized: true });
  },
  logout: async () => {
    try {
      localStorage.removeItem(DEMO_USER_KEY);
    } catch (e) {
      console.warn("Could not remove demo session from localStorage", e);
    }
    try {
      await auth.signOut();
    } catch (e) {
      console.warn("Firebase sign out warning:", e);
    }
    set({ user: null, profile: null, loading: false, initialized: true });
  }
}));

// Initialize auth listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      localStorage.removeItem(DEMO_USER_KEY);
    } catch {}
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
    const stored = getStoredDemoSession();
    if (!stored) {
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setProfile(null);
    }
  }
  
  useAuthStore.setState({ loading: false, initialized: true });
});
