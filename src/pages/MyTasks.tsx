import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';
import { Task } from '../types';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { isBefore, startOfDay, format } from 'date-fns';
import TaskModal from '../components/TaskModal';

export default function MyTasks() {
  const { profile } = useAuthStore();
  const { 
    allTasks, 
    loadingAllTasks, 
    projects, 
    loadingProjects, 
    subscribeToAllTasks, 
    subscribeToProjects 
  } = useProjectStore();
  const { users, fetchUsers } = useUserStore();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    const unsubProjects = subscribeToProjects();
    const unsubTasks = subscribeToAllTasks();
    fetchUsers();
    return () => {
      unsubProjects();
      unsubTasks();
    };
  }, [subscribeToProjects, subscribeToAllTasks, fetchUsers]);

  const handleOpenTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  if ((loadingProjects || loadingAllTasks) && allTasks.length === 0 && projects.length === 0) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Check if task was created by the active user
  const isCreatedByMe = (task: Task): boolean => {
    if (!profile) return false;
    if (!task.createdBy) return false;

    const myUid = profile.uid;
    const myEmail = (profile.email || '').trim().toLowerCase();
    const cleanCreatedBy = String(task.createdBy).trim().toLowerCase();

    // 1. Direct match on user UID
    if (task.createdBy === myUid || cleanCreatedBy === myUid.toLowerCase()) return true;

    // 2. Direct match on user email
    if (myEmail && cleanCreatedBy === myEmail) return true;

    // 3. Known seed alias mappings
    if (myEmail === 'admin@dfw.or.id' && (cleanCreatedBy === 'admin' || cleanCreatedBy === 'admin@dfw.or.id')) return true;
    if (myEmail === 'imam.trihatmadja@dfw.or.id' && (cleanCreatedBy === 'coordinator-imam' || cleanCreatedBy === 'coordinator-1')) return true;
    if (myEmail === 'budi.santoso@dfw.or.id' && (cleanCreatedBy === 'officer-1' || cleanCreatedBy === 'coordinator-1')) return true;
    if (myEmail === 'dewi.lestari@dfw.or.id' && cleanCreatedBy === 'officer-2') return true;

    // 4. Match against userStore users
    const matchedUser = users.find(u => u.uid === task.createdBy || (u.email && u.email.toLowerCase() === cleanCreatedBy));
    if (matchedUser && matchedUser.email && matchedUser.email.toLowerCase() === myEmail) {
      return true;
    }

    return false;
  };

  // Robust check to determine if a task is assigned to the current user
  const isAssignedToMe = (task: Task): boolean => {
    if (!profile) return false;
    if (!task.assignees || !Array.isArray(task.assignees) || task.assignees.length === 0) {
      return false;
    }

    const myUid = profile.uid;
    const myEmail = (profile.email || '').trim().toLowerCase();

    return task.assignees.some(assigneeId => {
      if (!assigneeId) return false;
      const cleanAssignee = String(assigneeId).trim().toLowerCase();

      // 1. Direct match on user UID
      if (assigneeId === myUid || cleanAssignee === myUid.toLowerCase()) return true;

      // 2. Direct match on user email
      if (myEmail && cleanAssignee === myEmail) return true;

      // 3. Known seed alias mappings
      if (myEmail === 'admin@dfw.or.id' && (cleanAssignee === 'admin' || cleanAssignee === 'admin@dfw.or.id')) return true;
      if (myEmail === 'imam.trihatmadja@dfw.or.id' && (cleanAssignee === 'coordinator-imam' || cleanAssignee === 'coordinator-1')) return true;
      if (myEmail === 'budi.santoso@dfw.or.id' && (cleanAssignee === 'officer-1' || cleanAssignee === 'coordinator-1')) return true;
      if (myEmail === 'dewi.lestari@dfw.or.id' && cleanAssignee === 'officer-2') return true;

      // 4. Match against users list in userStore
      const matchedUser = users.find(u => u.uid === assigneeId || (u.email && u.email.toLowerCase() === cleanAssignee));
      if (matchedUser && matchedUser.email && matchedUser.email.toLowerCase() === myEmail) {
        return true;
      }

      return false;
    });
  };

  const isMyTask = (task: Task): boolean => {
    return isAssignedToMe(task) || isCreatedByMe(task);
  };

  // Filter tasks: automatically include tasks created by user OR assigned to user
  let myTasks = allTasks.filter(isMyTask);

  if (filter === 'active') {
    myTasks = myTasks.filter(t => t.status !== 'Done');
  } else if (filter === 'completed') {
    myTasks = myTasks.filter(t => t.status === 'Done');
  }

  // Sort by due date (nearest first)
  myTasks.sort((a, b) => {
    if (a.status === 'Done' && b.status !== 'Done') return 1;
    if (a.status !== 'Done' && b.status === 'Done') return -1;
    
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    return b.createdAt - a.createdAt;
  });

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const isOverdue = (dueDate?: number) => {
    if (!dueDate) return false;
    const d = new Date(dueDate);
    return !isNaN(d.getTime()) && isBefore(d, startOfDay(new Date()));
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col min-h-full">
      {/* Top Page Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 sm:px-8 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 mr-3.5 shrink-0 flex items-center justify-center">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Tugas Saya
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola dan pantau seluruh tugas yang Anda buat maupun tugas yang didelegasikan kepada Anda.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center bg-white">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-md mb-4 sm:mb-0">
              <button 
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Completed
              </button>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {myTasks.length} {myTasks.length === 1 ? 'task' : 'tasks'}
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                      <div className="flex flex-col items-center justify-center">
                        <CheckSquare className="h-10 w-10 text-gray-300 mb-3" />
                        <p className="text-base font-medium text-gray-900 mb-1">Belum ada tugas</p>
                        <p>Belum ada tugas yang Anda buat atau ditugaskan kepada Anda saat ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  myTasks.map((task) => (
                    <tr 
                      key={task.id} 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${task.status === 'Done' ? 'bg-gray-50' : ''}`}
                      onClick={() => handleOpenTaskModal(task)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${task.status === 'Done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </span>
                            {isCreatedByMe(task) && !isAssignedToMe(task) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                Dibuat Anda
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span className="flex items-center">
                                <CheckSquare className="h-3 w-3 mr-1" />
                                {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length}
                              </span>
                            )}
                            {task.comments && task.comments.length > 0 && (
                              <span className="flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {task.comments.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          to={`/projects/${task.projectId}`} 
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-teal-600 hover:text-teal-900 hover:underline"
                        >
                          {getProjectName(task.projectId)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.dueDate ? (
                          <div className={`flex items-center text-sm ${isOverdue(task.dueDate) && task.status !== 'Done' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {isOverdue(task.dueDate) && task.status !== 'Done' ? (
                              <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                            ) : (
                              <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                            )}
                            {!isNaN(new Date(task.dueDate).getTime()) ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${task.status === 'Done' ? 'bg-green-100 text-green-800' : 
                            task.status === 'Review' ? 'bg-blue-100 text-blue-800' : 
                            task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase
                          ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-green-100 text-green-700'}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenTaskModal(task); }}
                          className="text-teal-600 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-md transition-colors"
                          title="View / Edit Task"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isTaskModalOpen && selectedTask && (
        <TaskModal 
          projectId={selectedTask.projectId}
          task={selectedTask}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
