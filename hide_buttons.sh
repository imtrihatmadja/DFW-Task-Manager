#!/bin/bash
sed -i 's/<div className="mt-4 md:mt-0 flex items-center space-x-3 no-print">/{!isPrinting \&\& (\n<div className="mt-4 md:mt-0 flex items-center space-x-3">\n/g' src/pages/Reporting.tsx
sed -i 's/<\/button>\n        <\/div>/\n<\/button>\n        <\/div>\n)}/g' src/pages/Reporting.tsx

sed -i 's/<div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-8 no-print flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">/{!isPrinting \&\& (\n<div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">\n/g' src/pages/Reporting.tsx
sed -i 's/<\/select>\n        <\/div>\n      <\/div>/<\/select>\n        <\/div>\n      <\/div>\n)}/g' src/pages/Reporting.tsx

# for print:block, let's make it block when isPrinting is true
sed -i 's/<div className="hidden print:block mb-8 text-center border-b-2 border-gray-200 pb-4">/{isPrinting \&\& (\n<div className="mb-8 text-center border-b-2 border-gray-200 pb-4">\n/g' src/pages/Reporting.tsx
sed -i 's/<\/p>\n        )}\n      <\/div>/<\/p>\n        )}\n      <\/div>\n)}/g' src/pages/Reporting.tsx

