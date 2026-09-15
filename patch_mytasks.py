import re

with open('src/pages/MyTasks.tsx', 'r') as f:
    content = f.read()

imports = """import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Task } from '../types';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertCircle, Edit3, MessageSquare } from 'lucide-react';
import { isBefore, startOfDay, format } from 'date-fns';
import TaskModal from '../components/TaskModal';
import { useProjectsQuery, useAllTasksQuery } from '../hooks/useQueries';"""

content = re.sub(r'import \{ useEffect, useState \} from \'react\';\nimport \{ useProjectStore \} from \'../store/projectStore\';\nimport \{ useAuthStore \} from \'../store/authStore\';\nimport \{ Task \} from \'../types\';\nimport \{ Link \} from \'react-router-dom\';\nimport \{ CheckSquare, Clock, AlertCircle, Edit3, MessageSquare \} from \'lucide-react\';\nimport \{ isBefore, startOfDay, format \} from \'date-fns\';\nimport TaskModal from \'../components/TaskModal\';', imports, content)

new_body = """export default function MyTasks() {
  const { profile } = useAuthStore();
  
  const { data: projects = [], isLoading: loadingProjects } = useProjectsQuery();
  const { data: allTasks = [], isLoading: loadingAllTasks } = useAllTasksQuery(projects);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const myTasks = allTasks.filter(task => {
    // Only show tasks assigned to the current user
    return task.assignees && task.assignees.includes(profile?.uid || '');
  });

  const filteredTasks = myTasks.filter(task => {
    if (filter === 'active') return task.status !== 'Done';
    if (filter === 'completed') return task.status === 'Done';
    return true;
  }).sort((a, b) => {
    if (a.status === 'Done' && b.status !== 'Done') return 1;
    if (a.status !== 'Done' && b.status === 'Done') return -1;
    
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (loadingProjects || loadingAllTasks) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }
"""

content = re.sub(r'export default function MyTasks\(\) \{.*?(?=  return \()', new_body, content, flags=re.DOTALL)

with open('src/pages/MyTasks.tsx', 'w') as f:
    f.write(content)
