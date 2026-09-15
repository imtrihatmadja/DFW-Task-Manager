import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban } from 'lucide-react';
import { Project, ProjectIndicator } from '../types';
import { generateId } from '../lib/utils';

export default function Projects() {
  const { projects, loadingProjects, subscribeToProjects, createProject } = useProjectStore();
  const profile = useAuthStore(state => state.profile);

  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectGoal, setNewProjectGoal] = useState('');
  const [newProjectOutcomes, setNewProjectOutcomes] = useState<string[]>(['']);
  const [newProjectOutputs, setNewProjectOutputs] = useState<string[]>(['']);
  const [newProjectIndicators, setNewProjectIndicators] = useState<Omit<ProjectIndicator, 'id' | 'current'>[]>([{ name: '', description: '', target: 0, unit: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToProjects();
    return () => unsubscribe();
  }, [subscribeToProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !profile) return;
    
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const indicators: ProjectIndicator[] = newProjectIndicators
        .filter(ind => ind.name.trim() !== '')
        .map(ind => ({
          id: generateId(),
          name: ind.name,
          target: Number(ind.target) || 0,
          unit: ind.unit,
          current: 0
        }));

      await createProject({
        name: newProjectName,
        description: newProjectDesc,
        goal: newProjectGoal,
        outcomes: newProjectOutcomes.filter(o => o.trim() !== ''),
        outputs: newProjectOutputs.filter(o => o.trim() !== ''),
        indicators,
        status: 'Active',
        members: [profile.uid],
        createdAt: Date.now(),
        createdBy: profile.uid
      });
      setShowModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectGoal('');
      setNewProjectOutcomes(['']);
      setNewProjectOutputs(['']);
      setNewProjectIndicators([{ name: '', description: '', target: 0, unit: '' }]);
    } catch (error: any) {
      console.error("Failed to create project", error);
      setErrorMsg(`Gagal membuat proyek: ${error.message || 'Periksa hak akses Anda'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrayChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => {
      const newArray = [...prev];
      newArray[index] = value;
      return newArray;
    });
  };

  const handleAddArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, '']);
  };

  const handleRemoveArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleIndicatorChange = (index: number, field: keyof Omit<ProjectIndicator, 'id' | 'current'>, value: string | number) => {
    setNewProjectIndicators(prev => {
      const newIndicators = [...prev];
      newIndicators[index] = { ...newIndicators[index], [field]: value };
      return newIndicators;
    });
  };

  const handleAddIndicator = () => {
    setNewProjectIndicators(prev => [...prev, { name: '', description: '', target: 0, unit: '' }]);
  };

  const handleRemoveIndicator = (index: number) => {
    setNewProjectIndicators(prev => prev.filter((_, i) => i !== index));
  };

  if (loadingProjects && projects.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
        <p className="text-gray-500 text-sm">Memuat data proyek DFW...</p>
      </div>
    );
  }

  const canCreateProject = profile?.role === 'admin' || profile?.role === 'project_coordinator';

  return (
    <div className="flex-1 bg-gray-50 flex flex-col min-h-full">
      {/* Top Page Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 sm:px-8 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 mr-3.5 shrink-0 flex items-center justify-center">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Daftar Proyek
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola dan pantau seluruh inisiatif proyek inspeksi dan monev DFW.
              </p>
            </div>
          </div>

          {canCreateProject && (
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Proyek Baru
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">

      {projects.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first project.</p>
          {canCreateProject && (
            <button 
              onClick={() => setShowModal(true)}
              className="text-teal-600 hover:text-teal-700 font-medium text-sm"
            >
              + Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link 
              key={project.id} 
              to={`/projects/${project.id}`}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow hover:border-teal-300 block group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-1">{project.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.status === 'Active' ? 'bg-green-100 text-green-800' :
                  project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-6 line-clamp-2 min-h-[40px]">
                {project.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-4">
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {/* Placeholder for member avatars */}
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {project.members.length}
                    </div>
                  </div>
                  <span className="ml-2">Members</span>
                </div>
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isSubmitting && setShowModal(false)}></div>
          <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <form onSubmit={handleCreate} className="flex flex-col overflow-hidden">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 overflow-y-auto flex-1">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4" id="modal-title">
                      Create New Project
                    </h3>
                    {errorMsg && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex justify-between items-center">
                        <span>{errorMsg}</span>
                        <button type="button" onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">
                          ✕
                        </button>
                      </div>
                    )}
                    <div className="mt-2 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name</label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                          placeholder="e.g. Muara Baru Port Expansion"
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          id="description"
                          name="description"
                          rows={2}
                          value={newProjectDesc}
                          onChange={(e) => setNewProjectDesc(e.target.value)}
                          className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Brief description of the project..."
                        />
                      </div>
                      <div>
                        <label htmlFor="goal" className="block text-sm font-medium text-gray-700">Project Goal</label>
                        <textarea
                          id="goal"
                          name="goal"
                          rows={2}
                          value={newProjectGoal}
                          onChange={(e) => setNewProjectGoal(e.target.value)}
                          className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Main goal of the project..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Outcomes</label>
                        {newProjectOutcomes.map((outcome, idx) => (
                          <div key={idx} className="flex mb-2">
                            <input
                              type="text"
                              value={outcome}
                              onChange={(e) => handleArrayChange(setNewProjectOutcomes, idx, e.target.value)}
                              className="p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-l-md focus:ring-teal-500 focus:border-teal-500"
                              placeholder="Outcome..."
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem(setNewProjectOutcomes, idx)}
                              disabled={newProjectOutcomes.length === 1}
                              className="px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem(setNewProjectOutcomes)}
                          className="mt-1 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Outcome
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Outputs</label>
                        {newProjectOutputs.map((output, idx) => (
                          <div key={idx} className="flex mb-2">
                            <input
                              type="text"
                              value={output}
                              onChange={(e) => handleArrayChange(setNewProjectOutputs, idx, e.target.value)}
                              className="p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-l-md focus:ring-teal-500 focus:border-teal-500"
                              placeholder="Output..."
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveArrayItem(setNewProjectOutputs, idx)}
                              disabled={newProjectOutputs.length === 1}
                              className="px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem(setNewProjectOutputs)}
                          className="mt-1 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Output
                        </button>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Monitoring Indicators</label>
                        <p className="text-xs text-gray-500 mb-3">Define measurable indicators for this project.</p>
                        
                        {newProjectIndicators.map((indicator, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-md mb-3 border border-gray-200 relative">
                            {newProjectIndicators.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveIndicator(idx)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                              >
                                &times;
                              </button>
                            )}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Indicator Name</label>
                                <input
                                  type="text"
                                  value={indicator.name}
                                  onChange={(e) => handleIndicatorChange(idx, 'name', e.target.value)}
                                  className="mt-1 p-1.5 block w-full shadow-sm text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                  placeholder="e.g. Number of training sessions"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Description</label>
                                <textarea
                                  value={indicator.description || ''}
                                  onChange={(e) => handleIndicatorChange(idx, 'description', e.target.value)}
                                  rows={2}
                                  className="mt-1 p-1.5 block w-full shadow-sm text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                  placeholder="How is this measured or what does it mean?"
                                />
                              </div>
                              <div className="flex space-x-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-700">Target Value</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={indicator.target}
                                    onChange={(e) => handleIndicatorChange(idx, 'target', e.target.value)}
                                    className="mt-1 p-1.5 block w-full shadow-sm text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-700">Unit</label>
                                  <input
                                    type="text"
                                    value={indicator.unit}
                                    onChange={(e) => handleIndicatorChange(idx, 'unit', e.target.value)}
                                    className="mt-1 p-1.5 block w-full shadow-sm text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="e.g. sessions, people, %"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddIndicator}
                          className="mt-1 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Indicator
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse space-x-3 space-x-reverse shrink-0 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting || !newProjectName.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowModal(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
