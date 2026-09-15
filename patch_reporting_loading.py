import re
with open('src/pages/Reporting.tsx', 'r') as f:
    content = f.read()

# Insert loading state right after chartData definition ends
chart_data_end = "    return data;\n  }, [projects, selectedProjectId]);"
loading_ui = """    return data;
  }, [projects, selectedProjectId]);

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }"""
content = content.replace(chart_data_end, loading_ui)

with open('src/pages/Reporting.tsx', 'w') as f:
    f.write(content)
