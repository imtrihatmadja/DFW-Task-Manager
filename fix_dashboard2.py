import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# I will find the first 'return (' which is inside the old metrics block? 
# Wait, let's just find the second `const metrics = useMemo(` block and remove it.

match = re.search(r'  const metrics = useMemo\(\(\) => \{\n    const activeProjectsCount = projects\.filter.*?return \(', content, re.DOTALL)
if match:
    # replace everything from second const metrics to just before return (
    bad_part = match.group(0)
    # Actually I should replace the bad_part with `return (`
    content = content.replace(bad_part, '  return (')

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
