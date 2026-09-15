import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, Task } from '../types';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';

const withQueryTimeout = <T>(promise: Promise<T>, ms: number = 1500): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Query timeout')), ms);
    promise.then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

export function useProjectsQuery() {
  const { profile } = useAuthStore();
  
  return useQuery({
    queryKey: ['projects', profile?.uid],
    queryFn: async () => {
      try {
        const q = profile?.role === 'admin' 
          ? query(collection(db, 'projects'))
          : query(collection(db, 'projects'), where('members', 'array-contains', profile?.uid));
          
        const snapshot = await withQueryTimeout(getDocs(q), 1500);
        const projects: Project[] = [];
        snapshot.forEach(doc => {
          projects.push({ id: doc.id, ...doc.data() } as Project);
        });
        if (projects.length > 0) return projects;
        return useProjectStore.getState().projects;
      } catch (error) {
        console.warn("Using projectStore cache for projects:", error);
        return useProjectStore.getState().projects;
      }
    },
    enabled: !!profile?.uid,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}

export function useAllTasksQuery(projects: Project[]) {
  const { profile } = useAuthStore();
  
  return useQuery({
    queryKey: ['allTasks', profile?.uid, projects.map(p => p.id).join(',')],
    queryFn: async () => {
      if (projects.length === 0) return useProjectStore.getState().allTasks;
      
      const projectIds = projects.map(p => p.id);
      
      // Firestore 'in' query has a limit of 10 items.
      const chunkedIds = [];
      for (let i = 0; i < projectIds.length; i += 10) {
        chunkedIds.push(projectIds.slice(i, i + 10));
      }
      
      let allTasks: Task[] = [];
      try {
        for (const chunk of chunkedIds) {
          const q = query(collection(db, 'tasks'), where('projectId', 'in', chunk));
          const snapshot = await withQueryTimeout(getDocs(q), 1500);
          snapshot.forEach(doc => {
            const task = { id: doc.id, ...doc.data() } as Task;
            if (profile?.role === 'field_officer') {
              const myUid = profile.uid;
              const myEmail = (profile.email || '').trim().toLowerCase();
              const isMatch = task.assignees?.some(a => {
                const clean = String(a).trim().toLowerCase();
                return a === myUid || clean === myEmail;
              });
              if (isMatch) {
                allTasks.push(task);
              }
            } else {
              allTasks.push(task);
            }
          });
        }
        if (allTasks.length > 0) return allTasks;
        return useProjectStore.getState().allTasks;
      } catch (error) {
        console.warn("Using projectStore cache for tasks:", error);
        return useProjectStore.getState().allTasks;
      }
    },
    enabled: !!profile?.uid,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });
}

export function useTeamUsersQuery() {
  const { profile } = useAuthStore();
  
  return useQuery({
    queryKey: ['teamUsers'],
    queryFn: async () => {
      const fallbackUsers = useUserStore.getState().users;
      try {
        const snapshot = await withQueryTimeout(getDocs(collection(db, 'users')), 2500);
        const users: any[] = [];
        snapshot.forEach(doc => {
          users.push({ uid: doc.id, ...doc.data() });
        });
        
        // Merge Firestore users with cached/initial users to ensure no registered members are missing
        const map = new Map<string, any>();
        fallbackUsers.forEach(u => map.set(u.email.toLowerCase(), u));
        users.forEach(u => {
          if (u.email) map.set(u.email.toLowerCase(), u);
          else map.set(u.uid, u);
        });
        return Array.from(map.values());
      } catch (error) {
        console.warn("Could not fetch team users from Firestore, using cached team users:", error);
        return fallbackUsers;
      }
    },
    enabled: !!profile?.uid,
    staleTime: 30 * 1000,
    retry: 0,
  });
}
