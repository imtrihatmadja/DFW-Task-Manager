import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Plus, FolderKanban, TrendingUp, X } from 'lucide-react';
import { Project } from '../types';
import ConfirmModal from '../components/ConfirmModal';

export default function PortfolioDetail() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const { portfolios, projects, loadingPortfolios, subscribeToPortfolios, subscribeToProjects, updatePortfolio } = useProjectStore();
  const profile = useAuthStore(state => state.profile);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectToUnlink, setProjectToUnlink] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const unsubPort = subscribeToPortfolios();
    const unsubProj = subscribeToProjects();
    return () => {
      unsubPort();
      unsubProj();
    };
  }, [subscribeToPortfolios, subscribeToProjects]);

  const portfolio = portfolios.find(p => p.id === portfolioId);
  
  if (!portfolio) {
    if (loadingPortfolios) {
      return (
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      );
    }
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-sm w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Portofolio Tidak Ditemukan</h2>
          <p className="text-gray-500 text-sm mb-4">Portofolio yang dicari tidak tersedia.</p>
          <button onClick={() => navigate('/portfolios')} className="text-teal-600 hover:text-teal-700 font-medium text-sm">
            Kembali ke Portofolio
          </button>
        </div>
      </div>
    );
  }

  const canEdit = profile?.role === 'admin' || profile?.role === 'project_coordinator';
  const currentProjectIds = portfolio.projectIds || [];
  const linkedProjects = projects.filter(p => currentProjectIds.includes(p.id));
  const availableProjects = projects.filter(p => !currentProjectIds.includes(p.id));

  // Helper to calculate progress based on indicators
  const calculateProjectProgress = (project: Project) => {
    const indicators = project.indicators || [];
    if (indicators.length === 0) return 0;
    return Math.round(
      indicators.reduce((acc, ind) => 
        acc + Math.min(100, Math.max(0, ((ind.current || 0) / (ind.target || 1)) * 100)), 0
      ) / indicators.length
    );
  };

  const averageProgress = linkedProjects.length > 0
    ? Math.round(linkedProjects.reduce((acc, p) => acc + calculateProjectProgress(p), 0) / linkedProjects.length)
    : 0;

  const handleLinkProject = async (projectId: string) => {
    if (!canEdit) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await updatePortfolio(portfolio.id, {
        projectIds: [...(portfolio.projectIds || []), projectId]
      });
      setShowLinkModal(false);
    } catch (error: any) {
      console.error("Failed to link project", error);
      setErrorMsg(`Gagal menautkan proyek: ${error?.message || 'Periksa hak akses'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkProject = async () => {
    if (!canEdit || !projectToUnlink) return;
    setErrorMsg(null);
    try {
      await updatePortfolio(portfolio.id, {
        projectIds: (portfolio.projectIds || []).filter(id => id !== projectToUnlink)
      });
      setProjectToUnlink(null);
    } catch (error: any) {
      console.error("Failed to unlink project", error);
      setErrorMsg(`Gagal memutuskan tautan proyek: ${error?.message || 'Periksa hak akses'}.`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link to="/portfolios" className="hover:text-teal-600 flex items-center transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Portfolios
          </Link>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
            <p className="text-gray-600 mt-1 max-w-2xl">{portfolio.description || "No description provided."}</p>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowLinkModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex justify-between items-center shadow-xs">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-3"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-50 mr-4">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{linkedProjects.length}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
            <div className="p-3 rounded-full bg-teal-50 mr-4">
              <TrendingUp className="h-6 w-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase mb-1">Average Progress</p>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-teal-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${averageProgress}%` }}
                  ></div>
                </div>
                <span className="text-xl font-bold text-gray-900">{averageProgress}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Projects List */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">Linked Projects</h2>
        
        {linkedProjects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Linked</h3>
            <p className="text-gray-500 mb-6">This portfolio is currently empty.</p>
            {canEdit && (
              <button 
                onClick={() => setShowLinkModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Add Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {linkedProjects.map(project => {
              const progress = calculateProjectProgress(project);
              return (
                <div key={project.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/projects/${project.id}`} className="text-lg font-bold text-gray-900 hover:text-teal-600 transition-colors line-clamp-1">
                        {project.name}
                      </Link>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        project.status === 'Active' ? 'bg-green-100 text-green-800' :
                        project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Project Progress</span>
                        <span className="font-semibold text-gray-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                    <Link to={`/projects/${project.id}`} className="text-sm font-medium text-teal-600 hover:text-teal-700">
                      View Project
                    </Link>
                    {canEdit && (
                      <button 
                        onClick={() => setProjectToUnlink(project.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isSubmitting && setShowLinkModal(false)}></div>
          <div className="relative bg-white rounded-lg text-left shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Add Project to Portfolio</h3>
              <button onClick={() => !isSubmitting && setShowLinkModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 bg-gray-50">
              {availableProjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">All available projects are already linked to this portfolio, or you don't have any active projects yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableProjects.map(project => (
                    <div key={project.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center hover:border-teal-300 transition-colors">
                      <div>
                        <h4 className="font-bold text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-1">{project.description}</p>
                      </div>
                      <button
                        onClick={() => handleLinkProject(project.id)}
                        disabled={isSubmitting}
                        className="ml-4 shrink-0 bg-white border border-teal-600 text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!projectToUnlink}
        title="Remove Project"
        message="Are you sure you want to remove this project from the portfolio?"
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleUnlinkProject}
        onCancel={() => setProjectToUnlink(null)}
        isDestructive={true}
      />
    </div>
  );
}
