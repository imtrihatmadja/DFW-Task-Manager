import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { Layers, Plus, FolderKanban } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { Link } from 'react-router-dom';

export default function Portfolios() {
  const { portfolios, loadingPortfolios, subscribeToPortfolios, createPortfolio, deletePortfolio, projects } = useProjectStore();
  const profile = useAuthStore(state => state.profile);
  
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPortfolios();
    return () => unsubscribe();
  }, [subscribeToPortfolios]);

  const canEdit = profile?.role === 'admin' || profile?.role === 'project_coordinator';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !profile) return;
    
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createPortfolio({
        name,
        description,
        projectIds: [],
        createdAt: Date.now(),
        createdBy: profile.uid
      });
      setShowModal(false);
      setName('');
      setDescription('');
    } catch (error: any) {
      console.error("Failed to create portfolio", error);
      setErrorMsg(`Gagal membuat portofolio: ${error.message || 'Periksa hak akses Anda'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePortfolio(deleteId);
      setDeleteId(null);
    } catch (error: any) {
      console.error("Failed to delete", error);
      setErrorMsg(`Gagal menghapus portofolio: ${error.message || 'Periksa hak akses Anda'}.`);
    }
  };

  if (loadingPortfolios && portfolios.length === 0) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
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
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Portofolio Program
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelompokkan dan pantau ringkasan kemajuan lintas inisiatif program.
              </p>
            </div>
          </div>
          
          {canEdit && (
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Portofolio Baru
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-7xl w-full mx-auto">
        {portfolios.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolios</h3>
            <p className="text-gray-500 mb-6">Group your projects by creating a portfolio.</p>
            {canEdit && (
              <button 
                onClick={() => setShowModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Create First Portfolio
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map(portfolio => {
              const portfolioProjects = projects.filter(p => portfolio.projectIds.includes(p.id));
              
              return (
                <div key={portfolio.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{portfolio.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                      {portfolio.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                      <FolderKanban className="h-4 w-4 mr-2" />
                      {portfolio.projectIds.length} Projects linked
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <Link to={`/portfolios/${portfolio.id}`} className="text-teal-600 hover:text-teal-700 font-medium text-sm">
                        View Details
                      </Link>
                      
                      {canEdit && (
                        <button 
                          onClick={(e) => { e.preventDefault(); setDeleteId(portfolio.id); }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-lg text-left shadow-xl w-full max-w-md flex flex-col">
            <form onSubmit={handleCreate}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-lg">
                <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4">Create New Portfolio</h3>
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex justify-between items-center">
                    <span>{errorMsg}</span>
                    <button type="button" onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Portfolio Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g. CSR Bank 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Optional description"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse space-x-3 space-x-reverse rounded-b-lg">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Portfolio'}
                </button>
                <button
                  type="button"
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

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Portfolio"
        message="Are you sure you want to delete this portfolio? The projects inside it will NOT be deleted, they will just be unlinked from this portfolio."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isDestructive={true}
      />
    </div>
  );
}
