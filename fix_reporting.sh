#!/bin/bash
cat << 'INNER_EOF' > /app/applet/src/pages/Reporting.tsx
import { useState, useMemo, useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { Printer, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Reporting() {
  const { projects } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // format: YYYY-MM

  // Process data for charts
  const chartData = useMemo(() => {
    let data: any[] = [];
    projects.forEach(p => {
      if (selectedProjectId !== 'all' && p.id !== selectedProjectId) return;
      
      if (p.indicators) {
        p.indicators.forEach(ind => {
          data.push({
            name: ind.name.length > 20 ? ind.name.substring(0, 20) + '...' : ind.name,
            fullName: ind.name,
            projectName: p.name,
            Target: ind.target || 0,
            Current: ind.current || 0,
            unit: ind.unit
          });
        });
      }
    });
    return data;
  }, [projects, selectedProjectId]);

  // Process updates (field notes)
  const fieldNotes = useMemo(() => {
    let updates: any[] = [];
    projects.forEach(p => {
      if (selectedProjectId !== 'all' && p.id !== selectedProjectId) return;
      
      if (p.indicators) {
        p.indicators.forEach(ind => {
          if (ind.updates) {
            ind.updates.forEach(update => {
              const date = new Date(update.timestamp);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              
              if (selectedMonth !== 'all' && monthKey !== selectedMonth) return;

              updates.push({
                projectId: p.id,
                projectName: p.name,
                indicatorName: ind.name,
                unit: ind.unit,
                ...update
              });
            });
          }
        });
      }
    });
    
    // Sort by newest
    return updates.sort((a, b) => b.timestamp - a.timestamp);
  }, [projects, selectedProjectId, selectedMonth]);

  // Extract available months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    projects.forEach(p => {
      if (p.indicators) {
        p.indicators.forEach(ind => {
          if (ind.updates) {
            ind.updates.forEach(update => {
              const date = new Date(update.timestamp);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              months.add(monthKey);
            });
          }
        });
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [projects]);

  const reportRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!reportRef.current) return;
    try {
      setIsPrinting(true);
      // Small delay to allow UI to update (hide buttons)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html2pdf = (await import("html2pdf.js")).default;
      const element = reportRef.current;
      const opt = {
        margin:       0.5,
        filename:     "DFW_Report.pdf",
        image:        { type: "jpeg", quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: "in", format: "letter", orientation: "portrait" }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Error generating PDF", err);
    } finally {
      setIsPrinting(false);
    }
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, 'MMMM yyyy');
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 print-container" ref={reportRef}>
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Reporting</h1>
          <p className="text-gray-500 mt-1">Indicator performance and qualitative field notes</p>
        </div>
        
        {!isPrinting && (
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print / PDF
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      {!isPrinting && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center">
              <Filter className="w-3 h-3 mr-1" />
              Filter by Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2 border"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Filter Notes by Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2 border"
            >
              <option value="all">All Time</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Report Header for Print */}
      {isPrinting && (
        <div className="mb-8 text-center border-b-2 border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DFW Monev & Project Hub Report</h1>
          <p className="text-gray-600">
            Generated on {format(new Date(), 'dd MMMM yyyy, HH:mm')}
          </p>
          {(selectedProjectId !== 'all' || selectedMonth !== 'all') && (
            <p className="text-sm font-medium text-teal-700 mt-2">
              Filters Applied: 
              {selectedProjectId !== 'all' && ` Project: ${projects.find(p => p.id === selectedProjectId)?.name}`}
              {selectedProjectId !== 'all' && selectedMonth !== 'all' && ' | '}
              {selectedMonth !== 'all' && ` Month: ${formatMonthLabel(selectedMonth)}`}
            </p>
          )}
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Indicator Performance (Target vs Realization)</h2>
        
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded border border-dashed border-gray-200">
            No indicator data available for the selected filters.
          </div>
        ) : (
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  tick={{ fontSize: 12, fill: '#6B7280' }} 
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
                          <p className="font-bold text-gray-900 mb-1">{data.fullName}</p>
                          <p className="text-xs text-gray-500 mb-2">{data.projectName}</p>
                          <p className="text-teal-700 font-medium">Target: {data.Target} {data.unit}</p>
                          <p className="text-blue-700 font-medium">Current: {data.Current} {data.unit}</p>
                          <p className="text-gray-500 font-medium mt-1">
                            Progress: {Math.round((data.Current / (data.Target || 1)) * 100)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Target" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Target" isAnimationActive={false} />
                <Bar dataKey="Current" fill="#0D9488" radius={[4, 4, 0, 0]} name="Realization" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Field Notes Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">
          Field Notes & Update Records
        </h2>
        
        {fieldNotes.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No field notes or updates found for the selected filters.
          </div>
        ) : (
          <div className="space-y-6">
            {fieldNotes.map((note, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="sm:w-1/4 mb-3 sm:mb-0 pr-4">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</div>
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(note.timestamp), 'dd MMM yyyy, HH:mm')}
                  </div>
                  
                  <div className="mt-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Added Value</div>
                  <div className="text-sm font-bold text-teal-700 bg-teal-50 inline-block px-2 py-1 rounded">
                    {note.value > 0 ? '+' : ''}{note.value} {note.unit}
                  </div>
                </div>
                
                <div className="sm:w-3/4 sm:border-l sm:border-gray-200 sm:pl-6">
                  <div className="mb-2">
                    <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded mr-2">
                      {note.projectName}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {note.indicatorName}
                    </span>
                  </div>
                  <div className="text-gray-700 text-sm bg-white p-3 border border-gray-200 rounded mt-2 whitespace-pre-wrap">
                    {note.note || <span className="italic text-gray-400">No additional remarks provided.</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
INNER_EOF
