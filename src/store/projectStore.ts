import { create } from 'zustand';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, where, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, Task, Portfolio } from '../types';
import { useAuthStore } from './authStore';
import { queryClient } from '../lib/queryClient';

const STORAGE_KEYS = {
  PROJECTS: 'dfw_projects_cache',
  PORTFOLIOS: 'dfw_portfolios_cache',
  TASKS: 'dfw_tasks_cache',
};

// Realistic initial seed data for DFW Indonesia Monev
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-safe-seas-01',
    name: 'Program SAFE Seas - Pelindungan Awak Kapal Perikanan (AKP)',
    description: 'Inisiatif pengawasan dan inspeksi terpadu untuk mencegah kerja paksa, penipuan perekrutan, dan kecelakaan kerja pada kapal perikanan tangkap.',
    goal: 'Meningkatkan kepatuhan pemilik kapal dan pemenuhan hak dasar awak kapal perikanan sesuai standar ILO C188 dan regulasi nasional.',
    outcomes: [
      'Peningkatan kepatuhan Perjanjian Kerja Laut Awak (PKLA) dan jaminan sosial ketenagakerjaan',
      'Optimalisasi koordinasi lintas instansi (KKP, Kemnaker, Syahbandar) dalam inspeksi gabungan di pelabuhan pangkalan'
    ],
    outputs: [
      'SOP & Instrumen Inspeksi Bersama di Pelabuhan Perikanan Terpadu',
      'Modul pelatihan hak ketenagakerjaan dan K3 bagi nahkoda & awak kapal perikanan',
      'Sistem database pencatatan hasil audit kepatuhan kapal'
    ],
    indicators: [
      {
        id: 'ind-1',
        name: 'Jumlah Kapal Terinspeksi Kepatuhan Ketenagakerjaan',
        description: 'Pemeriksaan fisik dokumen dan kelayakan kapal >30 GT sebelum SPB diterbitkan',
        target: 100,
        unit: 'Kapal',
        current: 46,
        updates: [
          {
            id: 'upd-1',
            value: 46,
            note: 'Hasil inspeksi gabungan triwulan berjalan di PPS Nizam Zachman Muara Baru',
            timestamp: Date.now() - 3 * 24 * 3600 * 1000,
            updatedBy: 'admin'
          }
        ]
      },
      {
        id: 'ind-2',
        name: 'Awak Kapal yang Memiliki PKLA Sah & Terdaftar',
        description: 'Verifikasi PKLA standar hak gaji, asuransi, dan repatriasi',
        target: 500,
        unit: 'Orang',
        current: 310,
        updates: [
          {
            id: 'upd-2',
            value: 310,
            note: 'Verifikasi awak kapal aktif armada Muara Baru & Benoa',
            timestamp: Date.now() - 5 * 24 * 3600 * 1000,
            updatedBy: 'admin'
          }
        ]
      }
    ],
    status: 'Active',
    members: ['admin', 'coordinator-1', 'officer-1', 'officer-2'],
    createdAt: Date.now() - 30 * 24 * 3600 * 1000,
    createdBy: 'system'
  },
  {
    id: 'proj-monev-muara-baru-02',
    name: 'Monev K3 & Fasilitas Keselamatan PPS Nizam Zachman Muara Baru',
    description: 'Pemantauan berkala sarana keselamatan pelayaran, akomodasi awak kapal, sanitasi, dan mitigasi bahaya kebakaran di pelabuhan perikanan samudera.',
    goal: 'Menjamin standar keselamatan kerja (K3) maritim dan sanitasi layak bagi seluruh kapal perikanan yang sandar di Muara Baru.',
    outcomes: [
      'Penyediaan fasilitas P3K dan alat keselamatan yang terverifikasi aktif pada 100% armada binaan',
      'Penurunan angka insiden kebakaran dan kecelakaan kerja saat bongkar muat'
    ],
    outputs: [
      'Checklist inspeksi kelayakan K3 kapal perikanan tangkap',
      'Peta jalur evakuasi & audit kelayakan dermaga barat & timur'
    ],
    indicators: [
      {
        id: 'ind-3',
        name: 'Audit Kelengkapan Alat Keselamatan (Life Jacket/Raft/APAR)',
        description: 'Pemeriksaan fisik sarana penyelamatan darurat di atas kapal',
        target: 80,
        unit: 'Kapal',
        current: 58,
        updates: [
          {
            id: 'upd-3',
            value: 58,
            note: 'Audit dermaga timur selesai dengan 58 kapal memenuhi standar sertifikasi',
            timestamp: Date.now() - 2 * 24 * 3600 * 1000,
            updatedBy: 'admin'
          }
        ]
      }
    ],
    status: 'Active',
    members: ['admin', 'coordinator-1', 'officer-1', 'officer-2'],
    createdAt: Date.now() - 20 * 24 * 3600 * 1000,
    createdBy: 'system'
  }
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-safe-seas-01',
    title: 'Verifikasi Dokumen PKLA KM Bahari Sentosa 08',
    description: 'Pemeriksaan klausul gaji, asuransi kecelakaan kerja, dan jam istirahat untuk 18 ABK sebelum keberangkatan melaut.',
    assignees: ['admin', 'officer-1'],
    status: 'In Progress',
    priority: 'High',
    dueDate: Date.now() + 2 * 24 * 3600 * 1000,
    startDate: Date.now() - 24 * 3600 * 1000,
    tags: ['Muara Baru', 'PKLA', 'Inspeksi'],
    subtasks: [
      {
        id: 'st-1',
        title: 'Cek daftar 18 ABK & Buku Pelaut',
        isCompleted: true,
        comments: [
          {
            id: 'c-sub-1',
            userId: 'admin',
            text: 'Semua buku pelaut terverifikasi aktif dan sah sesuai data Syahbandar Muara Baru.',
            createdAt: Date.now() - 24 * 3600 * 1000,
            imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
            imageName: 'verifikasi-dokumen-kapal.jpg'
          }
        ]
      },
      { id: 'st-2', title: 'Verifikasi kartu BPJS Ketenagakerjaan', isCompleted: true },
      { id: 'st-3', title: 'Tanda tangan berita acara verifikasi', isCompleted: false }
    ],
    createdAt: Date.now() - 2 * 24 * 3600 * 1000,
    createdBy: 'admin'
  },
  {
    id: 'task-2',
    projectId: 'proj-safe-seas-01',
    title: 'Koordinasi Tim Pengawas Ketenagakerjaan Disnakertrans & Syahbandar',
    description: 'Sinkronisasi jadwal patroli dan inspeksi terpadu bulan berjalan di pelabuhan pangkalan.',
    assignees: ['coordinator-1'],
    status: 'Done',
    priority: 'Medium',
    dueDate: Date.now() - 24 * 3600 * 1000,
    startDate: Date.now() - 3 * 24 * 3600 * 1000,
    completedAt: Date.now() - 18 * 3600 * 1000,
    tags: ['Regulasi', 'Koordinasi'],
    subtasks: [
      { id: 'st-4', title: 'Penyusunan surat tugas personil', isCompleted: true },
      { id: 'st-5', title: 'Konfirmasi kehadiran pengawas KKP & Kemnaker', isCompleted: true }
    ],
    createdAt: Date.now() - 4 * 24 * 3600 * 1000,
    createdBy: 'admin'
  },
  {
    id: 'task-4',
    projectId: 'proj-monev-muara-baru-02',
    title: 'Audit Kelayakan Sanitasi & Kotak P3K KM Mina Jaya 03',
    description: 'Pemeriksaan ruang akomodasi ABK, ketersediaan obat darurat, dan kebersihan galley kapal.',
    assignees: ['officer-1'],
    status: 'Done',
    priority: 'Low',
    dueDate: Date.now() - 12 * 3600 * 1000,
    startDate: Date.now() - 36 * 3600 * 1000,
    completedAt: Date.now() - 6 * 3600 * 1000,
    tags: ['K3', 'Sanitasi', 'Muara Baru'],
    subtasks: [
      { id: 'st-8', title: 'Cek tanggal kadaluarsa obat P3K kapal', isCompleted: true },
      { id: 'st-9', title: 'Inspeksi filter air bersih dan fasilitas sanitasi', isCompleted: true }
    ],
    createdAt: Date.now() - 2 * 24 * 3600 * 1000,
    createdBy: 'officer-1'
  },
  {
    id: 'task-3',
    projectId: 'proj-monev-muara-baru-02',
    title: 'Inspeksi Tabung Pemadam Api (APAR) & Life Raft KM Samudera Raya 12',
    description: 'Uji masa berlaku sertifikat dan tekanan tabung pemadam api guna memenuhi syarat keselamatan pelayaran.',
    assignees: ['officer-2'],
    status: 'To Do',
    priority: 'High',
    dueDate: Date.now() + 4 * 24 * 3600 * 1000,
    startDate: Date.now(),
    tags: ['K3', 'Dermaga Barat'],
    subtasks: [
      { id: 'st-6', title: 'Inspeksi 4 tabung APAR haluan & mesin', isCompleted: false },
      { id: 'st-7', title: 'Cek hydrostatic release unit pada inflatable liferaft', isCompleted: false }
    ],
    createdAt: Date.now() - 24 * 3600 * 1000,
    createdBy: 'admin'
  }
];

const INITIAL_PORTFOLIOS: Portfolio[] = [
  {
    id: 'port-dfw-utama',
    name: 'Portofolio Advokasi & Perlindungan Pekerja Maritim',
    description: 'Kumpulan program strategis DFW Indonesia dalam pengawasan ketenagakerjaan dan K3 pelabuhan perikanan.',
    projectIds: ['proj-safe-seas-01', 'proj-monev-muara-baru-02'],
    createdAt: Date.now() - 30 * 24 * 3600 * 1000,
    createdBy: 'admin'
  }
];

const getStored = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
};

const saveStored = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to persist to localStorage", err);
  }
};

const withTimeout = async <T>(promise: Promise<T>, ms: number = 2000): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Operation timeout')), ms);
    promise.then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    result[key] = val === undefined ? null : sanitizeForFirestore(val);
  }
  return result;
};

const rawProjects = getStored<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
const initialProjects = rawProjects.map(p => ({
  ...p,
  members: Array.isArray(p.members) && p.members.length > 0 ? p.members : ['admin', 'coordinator-1', 'officer-1', 'officer-2']
}));
const initialPortfolios = getStored<Portfolio[]>(STORAGE_KEYS.PORTFOLIOS, INITIAL_PORTFOLIOS);
const rawTasks = getStored<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
const initialTasks = rawTasks.map(t => {
  if (Array.isArray(t.assignees) && t.assignees.length > 0) return t;
  const foundSeed = INITIAL_TASKS.find(st => st.id === t.id);
  return foundSeed ? { ...t, assignees: foundSeed.assignees } : t;
});

// Ensure initial seed is saved if empty or updated
saveStored(STORAGE_KEYS.PROJECTS, initialProjects);
saveStored(STORAGE_KEYS.PORTFOLIOS, initialPortfolios);
saveStored(STORAGE_KEYS.TASKS, initialTasks);

interface ProjectState {
  projects: Project[];
  portfolios: Portfolio[];
  tasks: Task[];
  allTasks: Task[];
  loadingProjects: boolean;
  loadingPortfolios: boolean;
  loadingTasks: boolean;
  loadingAllTasks: boolean;
  subscribeToProjects: () => () => void;
  subscribeToPortfolios: () => () => void;
  subscribeToTasks: (projectId: string) => () => void;
  subscribeToAllTasks: () => () => void;
  createProject: (project: Omit<Project, 'id'>) => Promise<string>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createPortfolio: (portfolio: Omit<Portfolio, 'id'>) => Promise<string>;
  updatePortfolio: (id: string, data: Partial<Portfolio>) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id'>) => Promise<string>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: initialProjects,
  portfolios: initialPortfolios,
  tasks: initialTasks,
  allTasks: initialTasks,
  loadingProjects: false, // Instant readiness since we have cached/seed data
  loadingPortfolios: false,
  loadingTasks: false,
  loadingAllTasks: false,
  
  subscribeToProjects: () => {
    const profile = useAuthStore.getState().profile;
    
    // Only show loading if we don't have any cached projects
    if (get().projects.length === 0) {
      set({ loadingProjects: true });
    }
    
    // Fallback safety timeout: never block UI for more than 1s
    const timeoutId = setTimeout(() => {
      set({ loadingProjects: false });
    }, 1000);
    
    let q;
    try {
      if (profile?.role === 'admin' || profile?.role === 'project_coordinator') {
        q = query(collection(db, 'projects'));
      } else if (profile?.uid) {
        q = query(collection(db, 'projects'), where('members', 'array-contains', profile.uid));
      } else {
        q = query(collection(db, 'projects'));
      }
    } catch {
      clearTimeout(timeoutId);
      set({ loadingProjects: false });
      return () => {};
    }
    
    try {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        clearTimeout(timeoutId);
        if (!snapshot.empty) {
          const remoteProjects: Project[] = [];
          snapshot.forEach((doc) => {
            remoteProjects.push({ id: doc.id, ...doc.data() } as Project);
          });
          set({ projects: remoteProjects, loadingProjects: false });
          saveStored(STORAGE_KEYS.PROJECTS, remoteProjects);
        } else {
          set({ loadingProjects: false });
          // If Firestore collection is empty, auto-seed initial projects
          if (profile?.role === 'admin' || profile?.role === 'project_coordinator') {
            initialProjects.forEach(async (proj) => {
              try {
                await setDoc(doc(db, 'projects', proj.id), sanitizeForFirestore(proj));
              } catch (e) {
                console.warn("Could not auto-seed project to Firestore:", e);
              }
            });
          }
        }
      }, (error) => {
        clearTimeout(timeoutId);
        console.warn("Firestore snapshot notice (operating offline):", error?.message);
        set({ loadingProjects: false });
      });
      
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch {
      clearTimeout(timeoutId);
      set({ loadingProjects: false });
      return () => {};
    }
  },
  
  subscribeToPortfolios: () => {
    const profile = useAuthStore.getState().profile;
    if (get().portfolios.length === 0) {
      set({ loadingPortfolios: true });
    }
    
    const timeoutId = setTimeout(() => {
      set({ loadingPortfolios: false });
    }, 1000);
    
    try {
      const q = query(collection(db, 'portfolios'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        clearTimeout(timeoutId);
        if (!snapshot.empty) {
          const remotePortfolios: Portfolio[] = [];
          snapshot.forEach((doc) => {
            remotePortfolios.push({ id: doc.id, ...doc.data() } as Portfolio);
          });
          set({ portfolios: remotePortfolios, loadingPortfolios: false });
          saveStored(STORAGE_KEYS.PORTFOLIOS, remotePortfolios);
        } else {
          set({ loadingPortfolios: false });
          if (profile?.role === 'admin' || profile?.role === 'project_coordinator') {
            initialPortfolios.forEach(async (port) => {
              try {
                await setDoc(doc(db, 'portfolios', port.id), sanitizeForFirestore(port));
              } catch (e) {
                console.warn("Could not auto-seed portfolio to Firestore:", e);
              }
            });
          }
        }
      }, (error) => {
        clearTimeout(timeoutId);
        console.warn("Portfolios snapshot notice:", error?.message);
        set({ loadingPortfolios: false });
      });
      
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch {
      clearTimeout(timeoutId);
      set({ loadingPortfolios: false });
      return () => {};
    }
  },
  
  subscribeToTasks: (projectId: string) => {
    // Keep existing cached tasks for this project if available
    const existing = get().allTasks.filter(t => t.projectId === projectId);
    if (existing.length > 0) {
      set({ tasks: existing, loadingTasks: false });
    } else {
      set({ loadingTasks: true });
    }
    
    const timeoutId = setTimeout(() => {
      set({ loadingTasks: false });
    }, 1000);
    
    try {
      const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        clearTimeout(timeoutId);
        if (!snapshot.empty) {
          const tasks: Task[] = [];
          snapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() } as Task);
          });
          set({ tasks, loadingTasks: false });
          // Also merge into allTasks & cache
          const otherTasks = get().allTasks.filter(t => t.projectId !== projectId);
          const merged = [...otherTasks, ...tasks];
          set({ allTasks: merged });
          saveStored(STORAGE_KEYS.TASKS, merged);
        } else {
          set({ loadingTasks: false });
        }
      }, (error) => {
        clearTimeout(timeoutId);
        console.warn("Tasks snapshot notice:", error?.message);
        set({ loadingTasks: false });
      });
      
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch {
      clearTimeout(timeoutId);
      set({ loadingTasks: false });
      return () => {};
    }
  },

  subscribeToAllTasks: () => {
    if (get().allTasks.length === 0) {
      set({ loadingAllTasks: true });
    }
    
    const timeoutId = setTimeout(() => {
      set({ loadingAllTasks: false });
    }, 1000);
    
    try {
      const q = query(collection(db, 'tasks'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        clearTimeout(timeoutId);
        if (!snapshot.empty) {
          const allTasks: Task[] = [];
          snapshot.forEach((doc) => {
            allTasks.push({ id: doc.id, ...doc.data() } as Task);
          });
          set({ allTasks, loadingAllTasks: false });
          saveStored(STORAGE_KEYS.TASKS, allTasks);
        } else {
          set({ loadingAllTasks: false });
          const curProfile = useAuthStore.getState().profile;
          if (curProfile?.role === 'admin' || curProfile?.role === 'project_coordinator') {
            initialTasks.forEach(async (t) => {
              try {
                await setDoc(doc(db, 'tasks', t.id), sanitizeForFirestore(t));
              } catch (e) {
                console.warn("Could not auto-seed task to Firestore:", e);
              }
            });
          }
        }
      }, (error) => {
        clearTimeout(timeoutId);
        console.warn("All tasks snapshot notice:", error?.message);
        set({ loadingAllTasks: false });
      });
      
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch {
      clearTimeout(timeoutId);
      set({ loadingAllTasks: false });
      return () => {};
    }
  },

  createProject: async (projectData) => {
    const localId = 'proj-' + Date.now();
    const newProject = { id: localId, ...projectData } as Project;
    
    // Instant local state & localStorage update (0ms lag)
    const updated = [newProject, ...get().projects];
    set({ projects: updated });
    saveStored(STORAGE_KEYS.PROJECTS, updated);

    // Asynchronous background push with fast timeout
    try {
      const docRef = await withTimeout(addDoc(collection(db, 'projects'), sanitizeForFirestore(projectData)), 1500);
      if (docRef?.id) {
        const synced = get().projects.map(p => p.id === localId ? { ...p, id: docRef.id } : p);
        set({ projects: synced });
        saveStored(STORAGE_KEYS.PROJECTS, synced);
        return docRef.id;
      }
    } catch (err) {
      console.warn("Project synced to offline cache:", err);
    }
    return localId;
  },

  updateProject: async (id, data) => {
    const updated = get().projects.map((p) => (p.id === id ? { ...p, ...data } : p));
    set({ projects: updated });
    saveStored(STORAGE_KEYS.PROJECTS, updated);
    
    try {
      await withTimeout(updateDoc(doc(db, 'projects', id), sanitizeForFirestore(data)), 1500);
    } catch (err) {
      console.warn("Project update cached locally:", err);
    }
  },

  deleteProject: async (id) => {
    const updated = get().projects.filter((p) => p.id !== id);
    set({ projects: updated });
    saveStored(STORAGE_KEYS.PROJECTS, updated);
    
    try {
      await withTimeout(deleteDoc(doc(db, 'projects', id)), 1500);
    } catch (err) {
      console.warn("Project deletion cached locally:", err);
    }
  },

  createPortfolio: async (portfolioData) => {
    const localId = 'port-' + Date.now();
    const newPort = { id: localId, ...portfolioData } as Portfolio;
    
    const updated = [newPort, ...get().portfolios];
    set({ portfolios: updated });
    saveStored(STORAGE_KEYS.PORTFOLIOS, updated);

    try {
      const docRef = await withTimeout(addDoc(collection(db, 'portfolios'), sanitizeForFirestore(portfolioData)), 1500);
      if (docRef?.id) {
        const synced = get().portfolios.map(p => p.id === localId ? { ...p, id: docRef.id } : p);
        set({ portfolios: synced });
        saveStored(STORAGE_KEYS.PORTFOLIOS, synced);
        return docRef.id;
      }
    } catch (err) {
      console.warn("Portfolio synced to offline cache:", err);
    }
    return localId;
  },

  updatePortfolio: async (id, data) => {
    const updated = get().portfolios.map((p) => (p.id === id ? { ...p, ...data } : p));
    set({ portfolios: updated });
    saveStored(STORAGE_KEYS.PORTFOLIOS, updated);
    
    try {
      await withTimeout(updateDoc(doc(db, 'portfolios', id), sanitizeForFirestore(data)), 1500);
    } catch (err) {
      console.warn("Portfolio update cached locally:", err);
    }
  },

  deletePortfolio: async (id) => {
    const updated = get().portfolios.filter((p) => p.id !== id);
    set({ portfolios: updated });
    saveStored(STORAGE_KEYS.PORTFOLIOS, updated);
    
    try {
      await withTimeout(deleteDoc(doc(db, 'portfolios', id)), 1500);
    } catch (err) {
      console.warn("Portfolio deletion cached locally:", err);
    }
  },

  createTask: async (taskData) => {
    const localId = 'task-' + Date.now();
    const now = Date.now();
    const activeUid = useAuthStore.getState().profile?.uid;
    const effectiveCreatedBy = taskData.createdBy || activeUid || 'admin';
    const effectiveAssignees = (taskData.assignees && taskData.assignees.length > 0)
      ? taskData.assignees
      : (activeUid ? [activeUid] : (taskData.createdBy ? [taskData.createdBy] : []));

    const newTask: Task = { 
      id: localId, 
      ...taskData,
      createdBy: effectiveCreatedBy,
      assignees: effectiveAssignees,
      createdAt: taskData.createdAt || now,
      updatedAt: now,
      completedAt: taskData.status === 'Done' ? now : undefined
    };
    
    const updatedTasks = [newTask, ...get().tasks];
    const updatedAll = [newTask, ...get().allTasks];
    set({ tasks: updatedTasks, allTasks: updatedAll });
    saveStored(STORAGE_KEYS.TASKS, updatedAll);

    // Auto-add assignees and creator to project members so project and tasks are accessible to them in Firestore
    const membersToInclude = Array.from(new Set([
      ...effectiveAssignees,
      effectiveCreatedBy
    ])).filter(Boolean);

    if (membersToInclude.length > 0 && taskData.projectId) {
      const project = get().projects.find(p => p.id === taskData.projectId);
      if (project) {
        const existingMembers = project.members || [];
        const newMembers = Array.from(new Set([...existingMembers, ...membersToInclude]));
        if (newMembers.length > existingMembers.length) {
          get().updateProject(project.id, { members: newMembers });
        }
      }
    }

    // Invalidate React Query caches so all hooks update immediately
    queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });

    try {
      const docRef = await withTimeout(addDoc(collection(db, 'tasks'), sanitizeForFirestore({
        ...taskData,
        createdBy: effectiveCreatedBy,
        assignees: effectiveAssignees,
        createdAt: newTask.createdAt,
        updatedAt: now,
        completedAt: newTask.completedAt || null
      })), 1500);
      if (docRef?.id) {
        const syncTask = (t: Task) => t.id === localId ? { ...t, id: docRef.id } : t;
        const syncedTasks = get().tasks.map(syncTask);
        const syncedAll = get().allTasks.map(syncTask);
        set({ tasks: syncedTasks, allTasks: syncedAll });
        saveStored(STORAGE_KEYS.TASKS, syncedAll);
        queryClient.invalidateQueries({ queryKey: ['allTasks'] });
        return docRef.id;
      }
    } catch (err) {
      console.warn("Task synced to offline cache:", err);
    }
    return localId;
  },

  updateTask: async (id, data) => {
    const now = Date.now();
    const existing = get().allTasks.find(t => t.id === id);
    const updates: Partial<Task> = {
      ...data,
      updatedAt: now,
    };
    
    // Automatically manage completedAt when status changes
    if (data.status === 'Done' && (!existing || existing.status !== 'Done')) {
      updates.completedAt = now;
    } else if (data.status && data.status !== 'Done' && existing?.status === 'Done') {
      updates.completedAt = undefined;
    }

    const updatedTasks = get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    const updatedAll = get().allTasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ tasks: updatedTasks, allTasks: updatedAll });
    saveStored(STORAGE_KEYS.TASKS, updatedAll);

    // Auto-add assignees to project members
    const projectId = data.projectId || existing?.projectId;
    if (data.assignees && data.assignees.length > 0 && projectId) {
      const project = get().projects.find(p => p.id === projectId);
      if (project) {
        const existingMembers = project.members || [];
        const newMembers = Array.from(new Set([...existingMembers, ...data.assignees]));
        if (newMembers.length > existingMembers.length) {
          get().updateProject(project.id, { members: newMembers });
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    
    try {
      await withTimeout(updateDoc(doc(db, 'tasks', id), sanitizeForFirestore(updates)), 1500);
    } catch (err) {
      console.warn("Task update cached locally:", err);
    }
  },

  deleteTask: async (id) => {
    const updatedTasks = get().tasks.filter((t) => t.id !== id);
    const updatedAll = get().allTasks.filter((t) => t.id !== id);
    set({ tasks: updatedTasks, allTasks: updatedAll });
    saveStored(STORAGE_KEYS.TASKS, updatedAll);

    queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    
    try {
      await withTimeout(deleteDoc(doc(db, 'tasks', id)), 1500);
    } catch (err) {
      console.warn("Task deletion cached locally:", err);
    }
  }
}));

