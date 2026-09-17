import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { ArrowLeft, List as ListIcon, LayoutDashboard, Calendar, Plus, Users, Edit3, Trash2, BarChart2, FolderKanban, FileText, Paperclip, ExternalLink, MessageSquare, CheckSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Task } from '../types';
import BoardView from '../components/BoardView';
import TaskModal from '../components/TaskModal';
import TimelineView from '../components/TimelineView';
import ProjectMembersModal from '../components/ProjectMembersModal';
import ProjectSettingsModal from '../components/ProjectSettingsModal';
import MonitoringView from '../components/MonitoringView';
import ConfirmModal from '../components/ConfirmModal';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, tasks, loadingTasks, loadingProjects, subscribeToProjects, subscribeToTasks, deleteProject, deleteTask } = useProjectStore();
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'list' | 'board' | 'timeline' | 'monitoring' | 'documents'>('list');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    let unsubscribeTasks = () => {};
    const unsubscribeProjects = subscribeToProjects();
    
    if (projectId) {
      unsubscribeTasks = subscribeToTasks(projectId);
    }
    
    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
    };
  }, [projectId, subscribeToTasks, subscribeToProjects]);

  const handleOpenTaskModal = (task?: Task) => {
    setSelectedTask(task || null);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      navigate('/projects');
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      setErrorMsg(`Failed to delete project: ${error.message || 'Check permissions'}`);
    }
    setIsDeleteProjectModalOpen(false);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete);
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      setErrorMsg(`Failed to delete task: ${error.message || 'Check permissions'}`);
    }
    setTaskToDelete(null);
  };

  const promptDeleteTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setTaskToDelete(taskId);
  };

  if (!project) {
    if (loadingProjects) {
      return (
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data proyek...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-12">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Proyek Tidak Ditemukan</h2>
          <p className="text-gray-500 text-sm mb-6">Proyek yang Anda tuju belum tersedia atau ID tidak valid.</p>
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Proyek
          </Link>
        </div>
      </div>
    );
  }

  const canEditOrDelete = profile?.role === 'admin' || profile?.role === 'project_coordinator';

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6 bg-white">
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Link to="/projects" className="hover:text-gray-900 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <p className="text-gray-600 max-w-3xl mb-4">{project.description}</p>
            
            {(project.goal || (project.outcomes && project.outcomes.length > 0) || (project.outputs && project.outputs.length > 0)) && (
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 max-w-5xl mb-4">
                {project.goal && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Project Goal</h3>
                    <p className="text-sm text-gray-800">{project.goal}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.outcomes && project.outcomes.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Outcomes</h3>
                      <ul className="list-disc pl-4 space-y-1">
                        {project.outcomes.map((outcome, idx) => (
                          <li key={idx} className="text-sm text-gray-700 leading-relaxed">{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.outputs && project.outputs.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Outputs</h3>
                      <ul className="list-disc pl-4 space-y-1">
                        {project.outputs.map((output, idx) => (
                          <li key={idx} className="text-sm text-gray-700 leading-relaxed">{output}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-3 shrink-0">
            {canEditOrDelete && (
              <>
                <button 
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm"
                  title="Edit Project"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                {profile?.role === 'admin' && (
                  <button 
                    onClick={() => setIsDeleteProjectModalOpen(true)}
                    className="bg-white border border-gray-300 hover:bg-red-50 text-red-600 px-3 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm"
                    title="Delete Project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            <button 
              onClick={() => setIsMembersModalOpen(true)}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm"
            >
              <Users className="mr-2 h-4 w-4" />
              Members ({project.members.length})
            </button>
            <button 
              onClick={() => handleOpenTaskModal()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 mt-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center pb-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'list'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ListIcon className="mr-2 h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center pb-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'board'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Board
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center pb-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'timeline'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center pb-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'monitoring'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Monitoring
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center pb-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'documents'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="mr-2 h-4 w-4" />
            Dokumen (MoV)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-50 p-8">
        {loadingTasks && tasks.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'list' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                          No tasks yet. Create one to get started!
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => (
                        <tr 
                          key={task.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleOpenTaskModal(task)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex flex-col">
                              <span>{task.title}</span>
                              <div className="flex items-center gap-2 mt-1">
                                {task.comments && task.comments.length > 0 && (
                                  <span className="inline-flex items-center text-[11px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-normal" title={`${task.comments.length} komentar`}>
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {task.comments.length} komentar
                                  </span>
                                )}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <span className="inline-flex items-center text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-normal" title="Subtask selesai">
                                    <CheckSquare className="h-3 w-3 mr-1" />
                                    {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length} subtask
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.assignees.length > 0 ? task.assignees.length + ' members' : 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {task.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.priority}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenTaskModal(task); }}
                              className="text-teal-600 hover:text-teal-900 mr-3"
                              title="Edit Task"
                            >
                              <Edit3 className="h-4 w-4 inline" />
                            </button>
                            {canEditOrDelete && (
                              <button 
                                onClick={(e) => promptDeleteTask(e, task.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Task"
                              >
                                <Trash2 className="h-4 w-4 inline" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'board' && (
              <BoardView tasks={tasks} onTaskClick={handleOpenTaskModal} />
            )}

            {activeTab === 'timeline' && (
              <TimelineView tasks={tasks} onTaskClick={handleOpenTaskModal} />
            )}

            
            {activeTab === 'documents' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Paperclip className="w-5 h-5 mr-2 text-teal-600" />
                  Dokumen & Bukti Capaian (MoV)
                </h3>
                
                {(() => {
                  const allDocuments: {name: string, url: string, date: number, indicatorName: string}[] = [];
                  if (project?.indicators) {
                    project.indicators.forEach(ind => {
                      if (ind.updates) {
                        ind.updates.forEach(update => {
                          if (update.attachments) {
                            update.attachments.forEach(att => {
                              allDocuments.push({
                                name: att.name,
                                url: att.url,
                                date: update.timestamp,
                                indicatorName: ind.name
                              });
                            });
                          }
                        });
                      }
                    });
                  }
                  
                  if (allDocuments.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p>Belum ada dokumen yang diunggah.</p>
                        <p className="text-sm mt-1">Dokumen bukti yang diunggah saat update capaian indikator akan muncul di sini.</p>
                      </div>
                    );
                  }
                  
                  allDocuments.sort((a, b) => b.date - a.date);
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allDocuments.map((doc, idx) => (
                        <a 
                          key={idx} 
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="flex flex-col p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                            <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="font-medium text-sm text-gray-900 truncate mb-1" title={doc.name}>{doc.name}</span>
                          <span className="text-xs text-teal-700 bg-teal-50 inline-block px-2 py-0.5 rounded mb-2 truncate" title={doc.indicatorName}>{doc.indicatorName}</span>
                          <span className="text-xs text-gray-500 mt-auto">
                            {doc.date && !isNaN(new Date(doc.date).getTime()) 
                              ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(doc.date)) 
                              : '-'}
                          </span>
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'monitoring' && (
              <MonitoringView project={project} />
            )}
          </>
        )}
      </div>

      {isTaskModalOpen && projectId && (
        <TaskModal 
          projectId={projectId} 
          task={selectedTask} 
          onClose={handleCloseTaskModal} 
        />
      )}
      
      {isMembersModalOpen && (
        <ProjectMembersModal 
          project={project}
          onClose={() => setIsMembersModalOpen(false)}
        />
      )}

      {isSettingsModalOpen && (
        <ProjectSettingsModal 
          project={project}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteProjectModalOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? All tasks and data associated with it will be permanently removed.`}
        confirmText="Delete Project"
        onConfirm={handleDeleteProject}
        onCancel={() => setIsDeleteProjectModalOpen(false)}
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        onConfirm={handleDeleteTask}
        onCancel={() => setTaskToDelete(null)}
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={!!errorMsg}
        title="Error"
        message={errorMsg || ""}
        confirmText="OK"
        cancelText="Close"
        onConfirm={() => setErrorMsg(null)}
        onCancel={() => setErrorMsg(null)}
        isDestructive={false}
      />
    </div>
  );
}
