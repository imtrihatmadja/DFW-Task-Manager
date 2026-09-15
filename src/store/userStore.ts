import { create } from 'zustand';
import { collection, query, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Role } from '../types';
import { useAuthStore } from './authStore';

const USERS_STORAGE_KEY = 'dfw_users_v1';

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'admin',
    email: 'admin@dfw.or.id',
    displayName: 'Admin DFW (Koordinator Nasional)',
    photoURL: null,
    role: 'admin',
    createdAt: Date.now() - 30 * 24 * 3600 * 1000
  },
  {
    uid: 'coordinator-imam',
    email: 'imam.trihatmadja@dfw.or.id',
    displayName: 'Imam Trihatmadja',
    photoURL: null,
    role: 'project_coordinator',
    createdAt: Date.now() - 10 * 24 * 3600 * 1000
  },
  {
    uid: 'coordinator-1',
    email: 'budi.santoso@dfw.or.id',
    displayName: 'Budi Santoso (Project Coordinator)',
    photoURL: null,
    role: 'project_coordinator',
    createdAt: Date.now() - 25 * 24 * 3600 * 1000
  },
  {
    uid: 'officer-1',
    email: 'dewi.lestari@dfw.or.id',
    displayName: 'Dewi Lestari (Field Officer Muara Baru)',
    photoURL: null,
    role: 'field_officer',
    createdAt: Date.now() - 20 * 24 * 3600 * 1000
  },
  {
    uid: 'officer-2',
    email: 'ahmad.fauzi@dfw.or.id',
    displayName: 'Ahmad Fauzi (Pengawas K3 & Perikanan)',
    photoURL: null,
    role: 'field_officer',
    createdAt: Date.now() - 15 * 24 * 3600 * 1000
  }
];

const getStoredUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return INITIAL_USERS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_USERS;
    
    // Merge stored with INITIAL_USERS to ensure all default and added accounts persist
    const map = new Map<string, UserProfile>();
    INITIAL_USERS.forEach(u => map.set(u.email.toLowerCase(), u));
    parsed.forEach((u: UserProfile) => map.set(u.email.toLowerCase(), u));
    return Array.from(map.values());
  } catch {
    return INITIAL_USERS;
  }
};

const saveStoredUsers = (users: UserProfile[]) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn("Failed to persist users to localStorage", err);
  }
};

interface UserState {
  users: UserProfile[];
  loadingUsers: boolean;
  fetchUsers: () => Promise<void>;
  updateUserRole: (uid: string, newRole: Role) => Promise<void>;
  addUser: (userData: { email: string; displayName: string; role: Role; photoURL?: string | null }) => Promise<UserProfile>;
}

const withTimeout = <T>(promise: Promise<T>, ms: number = 2000): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Fetch timeout')), ms);
    promise.then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

export const useUserStore = create<UserState>((set, get) => ({
  users: getStoredUsers(),
  loadingUsers: false,
  fetchUsers: async () => {
    // Only set loadingUsers to true if we don't have any users cached yet
    if (get().users.length === 0) {
      set({ loadingUsers: true });
    }
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await withTimeout(getDocs(q), 2000);
      const firestoreUsers: UserProfile[] = [];
      snapshot.forEach((doc) => {
        firestoreUsers.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });

      // Auto-seed initial DFW team accounts to Firestore if remote collection is empty
      const currentProfile = useAuthStore.getState().profile;
      if (snapshot.empty && currentProfile?.role === 'admin') {
        INITIAL_USERS.forEach(async (u) => {
          try {
            await setDoc(doc(db, 'users', u.uid), {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              role: u.role,
              createdAt: u.createdAt || Date.now(),
              photoURL: u.photoURL || null
            }, { merge: true });
          } catch (e) {
            console.warn("Could not seed user to Firestore:", e);
          }
        });
      }

      // Merge firestore users with stored/initial users by email to avoid duplicate entries
      const mergedMap = new Map<string, UserProfile>();
      getStoredUsers().forEach(u => {
        const key = u.email ? u.email.toLowerCase() : u.uid;
        mergedMap.set(key, u);
      });
      
      firestoreUsers.forEach(u => {
        const key = u.email ? u.email.toLowerCase() : u.uid;
        const existing = mergedMap.get(key);
        mergedMap.set(key, { ...existing, ...u });
      });

      // Ensure the logged in user's profile is preserved with their active Auth UID
      if (currentProfile) {
        const key = currentProfile.email ? currentProfile.email.toLowerCase() : currentProfile.uid;
        const existing = mergedMap.get(key);
        mergedMap.set(key, { ...existing, ...currentProfile });
      }

      const combined = Array.from(mergedMap.values());
      saveStoredUsers(combined);
      set({ users: combined, loadingUsers: false });
    } catch (error) {
      console.warn("Firestore fetch users failed, using cached team members:", error);
      const currentProfile = useAuthStore.getState().profile;
      let existing = get().users;
      if (currentProfile && !existing.some(u => u.uid === currentProfile.uid)) {
        existing = [currentProfile, ...existing];
        saveStoredUsers(existing);
      }
      set({ users: existing, loadingUsers: false });
    }
  },
  updateUserRole: async (uid: string, newRole: Role) => {
    // Always update local state immediately
    const { users } = get();
    const updatedUsers = users.map(user => 
      user.uid === uid ? { ...user, role: newRole } : user
    );
    saveStoredUsers(updatedUsers);
    set({ users: updatedUsers });

    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      console.warn("Could not sync user role update to Firestore (saved locally):", error);
    }
  },
  addUser: async (userData) => {
    const emailClean = userData.email.trim().toLowerCase();
    const existing = get().users.find(u => u.email.toLowerCase() === emailClean);
    if (existing) {
      // If already exists, update role if needed
      await get().updateUserRole(existing.uid, userData.role);
      return existing;
    }

    const generatedUid = 'user-' + Date.now();
    const newUser: UserProfile = {
      uid: generatedUid,
      email: emailClean,
      displayName: userData.displayName.trim() || emailClean.split('@')[0],
      role: userData.role,
      photoURL: userData.photoURL || null,
      createdAt: Date.now()
    };

    const updated = [newUser, ...get().users];
    saveStoredUsers(updated);
    set({ users: updated });

    try {
      const userRef = doc(db, 'users', generatedUid);
      await setDoc(userRef, newUser);
    } catch (error) {
      console.warn("Could not save new user to Firestore (saved locally):", error);
    }

    return newUser;
  }
}));
