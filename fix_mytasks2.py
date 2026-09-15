import re

with open('src/pages/MyTasks.tsx', 'r') as f:
    content = f.read()

bad_str_1 = """  const myTasks = allTasks.filter(task => {
    // Only show tasks assigned to the current user
    return task.assignees && task.assignees.includes(profile?.uid || '');
  });

  const filteredTasks = myTasks.filter(task => {
    if (filter === 'active') return task.status !== 'Done';
    if (filter === 'completed') return task.status === 'Done';
    return true;
  }).sort((a, b) => {
    if (a.status === 'Done' && b.status !== 'Done') return 1;
    if (a.status !== 'Done' && b.status === 'Done') return -1;
    
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (loadingProjects || loadingAllTasks) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }"""

content = content.replace(bad_str_1, "")

with open('src/pages/MyTasks.tsx', 'w') as f:
    f.write(content)
