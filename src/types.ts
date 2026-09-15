export type Role = 'admin' | 'project_coordinator' | 'field_officer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
  createdAt: number;
}

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed';

export interface IndicatorUpdate {
  id: string;
  value: number;
  note: string;
  timestamp: number;
  updatedBy: string; // user UID
  attachments?: { name: string; url: string; driveFileId: string; }[];
}

export interface ProjectIndicator {
  id: string;
  name: string;
  description?: string;
  target: number;
  unit: string;
  current: number;
  updates?: IndicatorUpdate[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  goal?: string;
  outcomes?: string[];
  outputs?: string[];
  indicators?: ProjectIndicator[];
  status: ProjectStatus;
  members: string[]; // array of user UIDs
  createdAt: number;
  createdBy: string; // user UID
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  projectIds: string[]; // array of project IDs
  createdAt: number;
  createdBy: string;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  comments?: Comment[];
  comment?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
  imageUrl?: string;
  imageName?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignees: string[]; // array of user UIDs
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: number | null;
  startDate: number | null;
  tags: string[]; // e.g. location tags like 'Muara Baru'
  subtasks?: Subtask[];
  comments?: Comment[];
  createdAt: number;
  createdBy: string;
  completedAt?: number;
  updatedAt?: number;
}
