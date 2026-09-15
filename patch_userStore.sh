#!/bin/bash
cat << 'INNER_EOF' > src/store/userStore.ts
import { create } from 'zustand';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Role } from '../types';

interface UserState {
  users: UserProfile[];
  loadingUsers: boolean;
  fetchUsers: () => Promise<void>;
  updateUserRole: (uid: string, newRole: Role) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loadingUsers: false,
  fetchUsers: async () => {
    set({ loadingUsers: true });
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const users: UserProfile[] = [];
      snapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      set({ users, loadingUsers: false });
    } catch (error) {
      console.error("Error fetching users:", error);
      set({ loadingUsers: false });
    }
  },
  updateUserRole: async (uid: string, newRole: Role) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      
      // Update local state
      const { users } = get();
      const updatedUsers = users.map(user => 
        user.uid === uid ? { ...user, role: newRole } : user
      );
      set({ users: updatedUsers });
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }
}));
INNER_EOF
