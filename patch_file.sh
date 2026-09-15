#!/bin/bash
cat << 'INNER_EOF' > patch_content.txt
        {!isPrinting && (
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
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
INNER_EOF

# Find the line number of `{!isPrinting && (<div className="mt-4 md:mt-0 flex items-center space-x-3">`
START_LINE=$(grep -n '{!isPrinting && (<div className="mt-4 md:mt-0 flex items-center space-x-3">' src/pages/Reporting.tsx | head -n 1 | cut -d: -f1)

# Find the line number of `{/* Chart Section */}`
END_LINE=$(grep -n '{/\* Chart Section \*/}' src/pages/Reporting.tsx | head -n 1 | cut -d: -f1)

# Replace lines from START_LINE to END_LINE - 1 with the content of patch_content.txt
sed -i "${START_LINE},$((END_LINE - 1))c\\$(cat patch_content.txt | sed 's/$/\\/')" src/pages/Reporting.tsx

# Also, Recharts uses animations which might fail to render for html2canvas.
# Let's add isAnimationActive={false} to the Bar components.
sed -i 's/<Bar dataKey="Target" fill="#94A3B8" radius={\[4, 4, 0, 0\]} name="Target" \/>/<Bar dataKey="Target" fill="#94A3B8" radius={\[4, 4, 0, 0\]} name="Target" isAnimationActive={false} \/>/g' src/pages/Reporting.tsx
sed -i 's/<Bar dataKey="Current" fill="#0D9488" radius={\[4, 4, 0, 0\]} name="Realization" \/>/<Bar dataKey="Current" fill="#0D9488" radius={\[4, 4, 0, 0\]} name="Realization" isAnimationActive={false} \/>/g' src/pages/Reporting.tsx

