import re

with open('src/pages/Reporting.tsx', 'r') as f:
    content = f.read()

imports = """import { useState, useMemo, useRef } from 'react';
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
import { useProjectsQuery } from '../hooks/useQueries';"""

content = re.sub(r'import \{ useState, useMemo, useRef \} from \'react\';\nimport \{ useProjectStore \} from \'../store/projectStore\';\nimport \{ \s*BarChart,\s*Bar,\s*XAxis,\s*YAxis,\s*CartesianGrid,\s*Tooltip,\s*Legend,\s*ResponsiveContainer\n\} from \'recharts\';\nimport \{ Printer, Filter, Calendar \} from \'lucide-react\';\nimport \{ format \} from \'date-fns\';', imports, content)

new_body = """export default function Reporting() {
  const { data: projects = [], isLoading: loadingProjects } = useProjectsQuery();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // format: YYYY-MM
"""

content = re.sub(r'export default function Reporting\(\) \{\n  const \{ projects \} = useProjectStore\(\);\n  const \[selectedProjectId, setSelectedProjectId\] = useState<string>\(\'all\'\);\n  const \[selectedMonth, setSelectedMonth\] = useState<string>\(\'all\'\); // format: YYYY-MM\n', new_body, content)

with open('src/pages/Reporting.tsx', 'w') as f:
    f.write(content)
