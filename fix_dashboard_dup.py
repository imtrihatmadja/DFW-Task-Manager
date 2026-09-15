import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

bad_str = """  return (
      <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }"""

content = content.replace(bad_str, "")

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
