import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

bad_code = """  return () => {
      unsubProjects();
    };
  }, [subscribeToProjects]);

  // We need to subscribe to all tasks whenever projects change (so we have project IDs for the query if needed)
  useEffect(() => {
    if (loadingProjects) return;
    
    const unsubTasks = subscribeToAllTasks();
    return () => {
      unsubTasks();
    };
  }, [loadingProjects, subscribeToAllTasks]);"""

content = content.replace(bad_code, "")

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
