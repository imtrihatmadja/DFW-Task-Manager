import re

with open('src/main.tsx', 'r') as f:
    content = f.read()

imports = """import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App.tsx';
import './index.css';"""

content = re.sub(r'import \{StrictMode\} from \'react\';\nimport \{createRoot\} from \'react-dom/client\';\nimport App from \'./App\.tsx\';\nimport \'./index\.css\';', imports, content)

render_block = """createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);"""

content = re.sub(r'createRoot\(document\.getElementById\(\'root\'\)!\)\.render\(\s*<StrictMode>\s*<App />\s*</StrictMode>,\s*\);', render_block, content)

with open('src/main.tsx', 'w') as f:
    f.write(content)
