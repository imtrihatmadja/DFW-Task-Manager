import re

with open('src/pages/MyTasks.tsx', 'r') as f:
    content = f.read()

# I will find the left over useEffects and remove them
bad_code = """  return () => {
      unsubProjects();
    };
  }, [subscribeToProjects]);

  useEffect(() => {
    if (loadingProjects) return;
    
    const unsubTasks = subscribeToAllTasks();
    return () => {
      unsubTasks();
    };
  }, [loadingProjects, subscribeToAllTasks]);"""

content = content.replace(bad_code, "")

with open('src/pages/MyTasks.tsx', 'w') as f:
    f.write(content)
