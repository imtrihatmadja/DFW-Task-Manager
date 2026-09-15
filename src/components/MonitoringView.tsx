import React, { useState } from 'react';
import { Project, ProjectIndicator, IndicatorUpdate } from '../types';
import { useProjectStore } from '../store/projectStore';
import { Target, TrendingUp, CheckCircle2, History, X, Trash2, Paperclip, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ConfirmModal from './ConfirmModal';
import { uploadToDrive } from '../lib/drive';
import { generateId } from '../lib/utils';

interface MonitoringViewProps {
  project: Project;
}

export default function MonitoringView({ project }: MonitoringViewProps) {
  const { updateProject } = useProjectStore();
  const { profile } = useAuthStore();
  
  const canEdit = profile?.role === 'admin' || profile?.role === 'project_coordinator';
  
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<ProjectIndicator | null>(null);
  const [updateValue, setUpdateValue] = useState<number | string>('');
  const [updateNote, setUpdateNote] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updateToDelete, setUpdateToDelete] = useState<{ indicatorId: string, update: IndicatorUpdate } | null>(null);

  const indicators = project.indicators || [];

  if (indicators.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Indicators Configured</h3>
        <p className="text-gray-500">Monitoring indicators were not set up for this project.</p>
      </div>
    );
  }

  const handleUpdateClick = (indicator: ProjectIndicator) => {
    setSelectedIndicator(indicator);
    setUpdateValue('');
    setUpdateNote('');
    setAttachmentFile(null);
    setUpdateModalOpen(true);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndicator || !profile) return;
    
    const numValue = Number(updateValue);
    if (isNaN(numValue)) return;

    setIsSubmitting(true);
    
    try {
      let attachmentData = undefined;
      
      // Handle file upload to Google Drive if a file is selected
      if (attachmentFile) {
        try {
          const driveFile = await uploadToDrive(attachmentFile, project.name);
          attachmentData = [{
            name: driveFile.name,
            url: driveFile.url,
            driveFileId: driveFile.id
          }];
        } catch (uploadErr: any) {
          throw new Error("Failed to upload file to Google Drive. Please ensure you have granted Drive permissions.");
        }
      }

      const newUpdate: IndicatorUpdate = {
        id: generateId(),
        value: numValue,
        note: updateNote,
        timestamp: Date.now(),
        updatedBy: profile.uid,
        attachments: attachmentData
      };

      const updatedIndicators = indicators.map(ind => {
        if (ind.id === selectedIndicator.id) {
          const currentUpdates = ind.updates || [];
          return {
            ...ind,
            current: (ind.current || 0) + numValue,
            updates: [newUpdate, ...currentUpdates].sort((a, b) => b.timestamp - a.timestamp)
          };
        }
        return ind;
      });

      await updateProject(project.id, { indicators: updatedIndicators });
      setUpdateModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save indicator update", error);
      setErrorMsg(error.message || "An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUpdate = async () => {
    if (!updateToDelete) return;
    try {
      const updatedIndicators = indicators.map(ind => {
        if (ind.id === updateToDelete.indicatorId) {
          const updatedUpdates = (ind.updates || []).filter(u => u.id !== updateToDelete.update.id);
          return {
            ...ind,
            current: (ind.current || 0) - updateToDelete.update.value,
            updates: updatedUpdates
          };
        }
        return ind;
      });

      await updateProject(project.id, { indicators: updatedIndicators });
      setUpdateToDelete(null);
    } catch (error) {
      console.error("Failed to delete update", error);
      setErrorMsg("Failed to delete the update record.");
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp || isNaN(new Date(timestamp).getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-teal-600" />
            Performance Indicators
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {indicators.map((indicator) => {
            const percentage = Math.min(100, Math.round(((indicator.current || 0) / indicator.target) * 100)) || 0;
            const isCompleted = percentage >= 100;

            return (
              <div key={indicator.id} className="p-6 transition-colors hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      {isCompleted && <CheckCircle2 className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />}
                      {indicator.name}
                    </h3>
                    {indicator.description && (
                      <p className="text-sm text-gray-600 mt-1">{indicator.description}</p>
                    )}
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex flex-col md:items-end flex-shrink-0 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1 font-medium">Realization / Target</div>
                    <div className="flex items-baseline mb-3">
                      <span className={`text-2xl font-black ${isCompleted ? 'text-green-600' : 'text-gray-900'}`}>
                        {indicator.current || 0}
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-lg font-bold text-gray-600">{indicator.target}</span>
                      <span className="ml-1 text-sm font-medium text-gray-500">{indicator.unit}</span>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleUpdateClick(indicator)}
                        className="text-teal-600 hover:text-white text-sm font-medium border border-teal-600 hover:bg-teal-600 px-3 py-1.5 rounded transition-colors whitespace-nowrap w-full"
                      >
                        Update Capaian
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative pt-1 mb-4">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-gray-600 uppercase">
                        Progress
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold inline-block ${isCompleted ? 'text-green-600' : 'text-teal-600'}`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-200">
                    <div 
                      style={{ width: `${percentage}%` }} 
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-teal-500'}`}
                    ></div>
                  </div>
                </div>

                {/* History Log */}
                {indicator.updates && indicator.updates.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <History className="w-4 h-4 mr-1.5 text-gray-500" />
                      Update History
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                      {indicator.updates.map((update) => (
                        <div key={update.id} className="bg-white p-3 rounded border border-gray-100 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-800">
                              Update: {update.value > 0 ? '+' : ''}{update.value} {indicator.unit}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 font-medium">
                                {formatDate(update.timestamp)}
                              </span>
                              {canEdit && (
                                <button
                                  onClick={() => setUpdateToDelete({ indicatorId: indicator.id, update })}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                  title="Delete this update"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {update.note && (
                            <p className="text-gray-600 text-xs mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                              {update.note}
                            </p>
                          )}
                          
                          {/* Attachments */}
                          {update.attachments && update.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {update.attachments.map((file, idx) => (
                                <a
                                  key={idx}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded border border-teal-100 hover:bg-teal-100 transition-colors"
                                >
                                  <Paperclip className="w-3 h-3 mr-1" />
                                  <span className="truncate max-w-[150px]">{file.name}</span>
                                  <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Update Modal */}
      {updateModalOpen && selectedIndicator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isSubmitting && setUpdateModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg text-left shadow-xl w-full max-w-md flex flex-col">
            <form onSubmit={handleSaveUpdate}>
              <div className="bg-white px-6 pt-5 pb-6 rounded-t-lg max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900">
                    Update Capaian Indikator
                  </h3>
                  <button type="button" onClick={() => !isSubmitting && setUpdateModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-1">Indikator</p>
                  <p className="text-gray-900 font-bold leading-snug">{selectedIndicator.name}</p>
                  <p className="text-sm text-gray-600 mt-2 border-t border-gray-200 pt-2">Capaian Saat Ini: <span className="font-black text-teal-600">{selectedIndicator.current || 0}</span> / {selectedIndicator.target} {selectedIndicator.unit}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Penambahan Capaian ({selectedIndicator.unit}) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Catatan Capaian <span className="text-red-500">*</span></label>
                    <textarea
                      rows={3}
                      required
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Jelaskan capaian ini (misal: Laporan kegiatan sosialisasi)..."
                    />
                  </div>
                  
                  {/* File Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dokumen / Bukti (MoV)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="space-y-1 text-center">
                        <Paperclip className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500 px-2 py-1 shadow-sm border border-gray-200"
                          >
                            <span>Pilih File</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">File akan diunggah ke Google Drive</p>
                        {attachmentFile && (
                          <div className="mt-3 text-sm font-medium text-gray-900 bg-white p-2 rounded border border-gray-200 inline-block shadow-sm">
                            Terpilih: {attachmentFile.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse space-x-3 space-x-reverse rounded-b-lg border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting || updateValue === '' || !updateNote.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan & Mengunggah...' : 'Simpan Capaian'}
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      <ConfirmModal
        isOpen={!!updateToDelete}
        title="Delete Update Record"
        message={`Are you sure you want to delete this update (${updateToDelete?.update.value && updateToDelete.update.value > 0 ? '+' : ''}${updateToDelete?.update.value})? This will revert the total back.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteUpdate}
        onCancel={() => setUpdateToDelete(null)}
        isDestructive={true}
      />
    </div>
  );
}
