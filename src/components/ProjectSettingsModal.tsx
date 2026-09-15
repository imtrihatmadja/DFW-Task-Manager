import React, { useState } from 'react';
import { Project, ProjectIndicator } from '../types';
import { Plus } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { generateId } from '../lib/utils';

interface ProjectSettingsModalProps {
  project: Project;
  onClose: () => void;
}

export default function ProjectSettingsModal({ project, onClose }: ProjectSettingsModalProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [goal, setGoal] = useState(project.goal || '');
  const [outcomes, setOutcomes] = useState<string[]>(project.outcomes?.length ? project.outcomes : ['']);
  const [outputs, setOutputs] = useState<string[]>(project.outputs?.length ? project.outputs : ['']);
  const [indicators, setIndicators] = useState<ProjectIndicator[]>(
    project.indicators?.length 
      ? project.indicators 
      : [{ id: generateId(), name: '', description: '', target: 0, unit: '', current: 0 }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { updateProject } = useProjectStore();

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

  const handleIndicatorChange = (index: number, field: keyof ProjectIndicator, value: string | number) => {
    setIndicators(prev => {
      const newIndicators = [...prev];
      newIndicators[index] = { ...newIndicators[index], [field]: value };
      return newIndicators;
    });
  };

  const handleAddIndicator = () => {
    setIndicators(prev => [...prev, { id: generateId(), name: '', description: '', target: 0, unit: '', current: 0 }]);
  };

  const handleRemoveIndicator = (index: number) => {
    setIndicators(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      
      const filteredIndicators = indicators
        .filter(ind => ind.name.trim() !== '')
        .map(ind => ({
          ...ind,
          target: Number(ind.target) || 0
        }));

      await updateProject(project.id, {
        name,
        description,
        goal,
        outcomes: outcomes.filter(o => o.trim() !== ''),
        outputs: outputs.filter(o => o.trim() !== ''),
        indicators: filteredIndicators,
      });
      onClose();
    } catch (error: any) {
      console.error("Failed to update project", error);
      setErrorMsg(`Gagal memperbarui proyek: ${error.message || 'Periksa hak akses Anda'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isSubmitting && onClose()}></div>
      <div className="relative bg-white rounded-lg text-left shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden max-h-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 overflow-y-auto flex-1">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4" id="modal-title">
                  Edit Project Settings
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="goal" className="block text-sm font-medium text-gray-700">Project Goal</label>
                    <textarea
                      id="goal"
                      name="goal"
                      rows={2}
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Outcomes</label>
                    {outcomes.map((outcome, idx) => (
                      <div key={idx} className="flex mb-2">
                        <input
                          type="text"
                          value={outcome}
                          onChange={(e) => handleArrayChange(setOutcomes, idx, e.target.value)}
                          className="p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-l-md focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Outcome..."
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem(setOutcomes, idx)}
                          disabled={outcomes.length === 1}
                          className="px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem(setOutcomes)}
                      className="mt-1 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Outcome
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Outputs</label>
                    {outputs.map((output, idx) => (
                      <div key={idx} className="flex mb-2">
                        <input
                          type="text"
                          value={output}
                          onChange={(e) => handleArrayChange(setOutputs, idx, e.target.value)}
                          className="p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-l-md focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Output..."
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem(setOutputs, idx)}
                          disabled={outputs.length === 1}
                          className="px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddArrayItem(setOutputs)}
                      className="mt-1 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Output
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Monitoring Indicators</label>
                    <p className="text-xs text-gray-500 mb-3">Define measurable indicators for this project.</p>
                    
                    {indicators.map((indicator, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-md mb-3 border border-gray-200 relative">
                        {indicators.length > 1 && (
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
              disabled={isSubmitting || !name.trim()}
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onClose()}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
