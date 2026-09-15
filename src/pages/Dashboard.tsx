import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity, 
  LayoutDashboard,
  Target,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { isBefore, startOfDay } from 'date-fns';
import ActivityFeed from '../components/ActivityFeed';
import TaskModal from '../components/TaskModal';
import { Task } from '../types';

export default function Dashboard() {
  const { profile } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const { 
    projects, 
    allTasks, 
    loadingProjects, 
    loadingAllTasks, 
    subscribeToProjects, 
    subscribeToAllTasks 
  } = useProjectStore();

  useEffect(() => {
    const unsubProjects = subscribeToProjects();
    const unsubTasks = subscribeToAllTasks();
    return () => {
      unsubProjects();
      unsubTasks();
    };
  }, [subscribeToProjects, subscribeToAllTasks]);

  const metrics = useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        activeProjectsCount: 0,
        completedProjectsCount: 0,
        onHoldProjectsCount: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        averageProgress: 0,
        recentTasks: []
      };
    }

    const activeProjectsCount = projects.filter(p => p.status === 'Active').length;
    const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;
    const onHoldProjectsCount = projects.filter(p => p.status === 'On Hold').length;

    const inProgressTasks = allTasks.filter(t => t.status === 'In Progress').length;
    const completedTasks = allTasks.filter(t => t.status === 'Done').length;
    const overdueTasks = allTasks.filter(t => {
      if (t.status === 'Done' || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      return !isNaN(d.getTime()) && isBefore(d, startOfDay(new Date()));
    }).length;

    // Calculate average progress across indicators
    let totalProgress = 0;
    let totalIndicators = 0;
    projects.forEach(p => {
      if (p.indicators) {
        p.indicators.forEach(ind => {
          if (ind.target > 0) {
            const pct = Math.min(100, Math.round((ind.current / ind.target) * 100));
            totalProgress += pct;
            totalIndicators++;
          }
        });
      }
    });
    const averageProgress = totalIndicators > 0 ? Math.round(totalProgress / totalIndicators) : 0;

    // Get urgent/pending tasks
    const recentTasks = [...allTasks]
      .filter(t => t.status !== 'Done')
      .sort((a, b) => {
        const timeA = a.dueDate && !isNaN(new Date(a.dueDate).getTime()) ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate && !isNaN(new Date(b.dueDate).getTime()) ? new Date(b.dueDate).getTime() : Infinity;
        return timeA - timeB;
      })
      .slice(0, 5);

    return {
      activeProjectsCount,
      completedProjectsCount,
      onHoldProjectsCount,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      averageProgress,
      recentTasks
    };
  }, [projects, allTasks]);

  if ((loadingProjects || loadingAllTasks) && projects.length === 0 && allTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col min-h-full">
      {/* Top Page Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 sm:px-8 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 mr-3.5 shrink-0 flex items-center justify-center">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Dashboard Eksekutif & Monitoring
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Selamat datang kembali, <span className="font-semibold text-gray-700">{profile?.displayName || 'Tim DFW'}</span>! Pantau capaian program dan aktivitas pengawasan secara real-time.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Projects */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-5 flex items-start">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-600 mr-4 shrink-0">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Proyek Aktif</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{metrics.activeProjectsCount}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Dari total {projects.length} inisiatif program</p>
          </div>
        </div>

        {/* Tasks In Progress */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-5 flex items-start">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4 shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tugas Dikerjakan</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{metrics.inProgressTasks}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Sedang aktif berjalan di lapangan</p>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-5 flex items-start">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 mr-4 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tugas Selesai</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{metrics.completedTasks}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Verifikasi & audit tuntas</p>
          </div>
        </div>

        {/* Overdue / Critical Deadlines */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-5 flex items-start">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600 mr-4 shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenggat Lewat</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{metrics.overdueTasks}</h3>
            <p className={`text-[11px] mt-1 font-medium ${metrics.overdueTasks > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
              {metrics.overdueTasks > 0 ? 'Perlu perhatian khusus segera' : 'Semua tugas tepat jadwal'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Activity Feed (2 Cols) + Sidebar Info (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed 
            onSelectTask={(task) => setSelectedTask(task)} 
            maxInitialItems={8}
          />
        </div>

        {/* Right Sidebar: Project Status & Priority Tasks */}
        <div className="lg:col-span-1 space-y-6">
          {/* Project Status Summary */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 flex items-center">
                <Briefcase className="h-4 w-4 mr-2 text-teal-600" />
                Distribusi Status Proyek
              </h2>
              <span className="text-xs font-semibold text-gray-500">{projects.length} Total</span>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-semibold text-gray-700">Aktif (Active)</span>
                    <span className="font-bold text-gray-900">{metrics.activeProjectsCount} Proyek</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-teal-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${projects.length ? (metrics.activeProjectsCount / projects.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-semibold text-gray-700">Selesai (Completed)</span>
                    <span className="font-bold text-gray-900">{metrics.completedProjectsCount} Proyek</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${projects.length ? (metrics.completedProjectsCount / projects.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-semibold text-gray-700">Ditunda (On Hold)</span>
                    <span className="font-bold text-gray-900">{metrics.onHoldProjectsCount} Proyek</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-amber-400 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${projects.length ? (metrics.onHoldProjectsCount / projects.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">Rata-rata Capaian Indikator:</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {metrics.averageProgress}%
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <Link to="/projects" className="text-teal-600 hover:text-teal-700 text-xs font-semibold inline-flex items-center">
                  Kelola Semua Proyek <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Priority Tasks */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-teal-600" />
                Tugas Prioritas Tertinggi
              </h2>
              <span className="text-[11px] text-gray-500">{metrics.recentTasks.length} Tertunda</span>
            </div>
            <div className="p-0 overflow-auto">
              {metrics.recentTasks.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-xs">
                  Tidak ada tugas prioritas yang tertunda.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {metrics.recentTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const isOverdue = !!task.dueDate && !isNaN(new Date(task.dueDate).getTime()) && isBefore(new Date(task.dueDate), startOfDay(new Date()));
                    
                    return (
                      <li key={task.id} className="p-3.5 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => setSelectedTask(task)}
                              className="text-left text-xs font-semibold text-gray-900 hover:text-teal-600 truncate block w-full"
                            >
                              {task.title}
                            </button>
                            <div className="text-[11px] text-gray-500 flex items-center mt-1 truncate">
                              <span className="font-medium text-gray-600 truncate max-w-[140px]">{project?.name || 'Proyek DFW'}</span>
                              <span className="mx-1.5">•</span>
                              <span className={`${isOverdue ? 'text-rose-600 font-bold' : 'text-gray-400'}`}>
                                {task.dueDate ? `Tenggat: ${new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : 'Tanpa tenggat'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-1 shrink-0">
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              task.priority === 'High' ? 'bg-red-100 text-red-700' :
                              task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                              task.status === 'Review' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal for interactive preview & edits */}
      {selectedTask && (
        <TaskModal
          projectId={selectedTask.projectId}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
      </div>
    </div>
  );
}

