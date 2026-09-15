#!/bin/bash

# We will use sed to replace handlePrint
sed -i 's/const handlePrint = () => {/const reportRef = useRef<HTMLDivElement>(null);\n  const [isPrinting, setIsPrinting] = useState(false);\n\n  const handlePrint = async () => {\n    if (!reportRef.current) return;\n    try {\n      setIsPrinting(true);\n      \/\/ Small delay to allow UI to update (hide buttons)\n      await new Promise(resolve => setTimeout(resolve, 100));\n      \n      const html2pdf = (await import("html2pdf.js")).default;\n      const element = reportRef.current;\n      const opt = {\n        margin:       0.5,\n        filename:     "DFW_Report.pdf",\n        image:        { type: "jpeg", quality: 0.98 },\n        html2canvas:  { scale: 2, useCORS: true },\n        jsPDF:        { unit: "in", format: "letter", orientation: "portrait" }\n      };\n      \n      await html2pdf().set(opt).from(element).save();\n    } catch (err) {\n      console.error("Error generating PDF", err);\n    } finally {\n      setIsPrinting(false);\n    }\n  };/g' src/pages/Reporting.tsx

# Also we need to attach the ref to the root div, and hide the no-print elements conditionally.
sed -i 's/<div className="max-w-7xl mx-auto pb-12 print-container">/<div className="max-w-7xl mx-auto pb-12 print-container" ref={reportRef}>/g' src/pages/Reporting.tsx

