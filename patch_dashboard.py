import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

imports = """import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity, 
  Calendar,
  LayoutDashboard,
  Target,
  TrendingUp,
  History
} from 'lucide-react';
import { isBefore, startOfDay } from 'date-fns';
import { useProjectsQuery, useAllTasksQuery } from '../hooks/useQueries';"""

# replace imports
content = re.sub(r'import \{ useEffect, useMemo \} from \'react\';\nimport \{ useProjectStore \} from \'../store/projectStore\';\nimport \{ useAuthStore \} from \'../store/authStore\';\nimport \{ Link \} from \'react-router-dom\';\nimport \{\s*Briefcase,\s*CheckCircle2,\s*AlertCircle,\s*Clock,\s*Activity,\s*Calendar,\s*LayoutDashboard,\s*Target,\s*TrendingUp,\s*History\n\} from \'lucide-react\';\nimport \{ isBefore, startOfDay \} from \'date-fns\';', imports, content)

# Find the function definition
func_def = "export default function Dashboard() {"
# find the return statement
return_stmt = "  return ("

# The part between them needs to be replaced. Let's see what is there.
# using a regex to replace between func_def and return_stmt

new_body = """export default function Dashboard() {
  const { profile } = useAuthStore();
  
  const { data: projects = [], isLoading: loadingProjects } = useProjectsQuery();
  const { data: allTasks = [], isLoading: loadingAllTasks } = useAllTasksQuery(projects);

  const metrics = useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        activeProjectsCount: 0,
        completedProjectsCount: 0,
        onHoldProjectsCount: 0,
        recentTasks: [],
        upcomingDeadlines: 0,
        recentUpdates: []
      };
    }

    const activeProjectsCount = projects.filter(p => p.status === 'Active').length;
    const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;
    const onHoldProjectsCount = projects.filter(p => p.status === 'On Hold').length;

    // Collect all updates from projects
    const allUpdates: { projectId: string; projectName: string; indicatorId: string; indicatorName: string; unit: string; update: any }[] = [];
    projects.forEach(project => {
      if (project.indicators) {
        project.indicators.forEach(indicator => {
          if (indicator.updates) {
            indicator.updates.forEach(update => {
              allUpdates.push({
                projectId: project.id,
                projectName: project.name,
                indicatorId: indicator.id,
                indicatorName: indicator.name,
                unit: indicator.unit,
                update
              });
            });
          }
        });
      }
    });

    // Sort by timestamp desc and take top 5
    allUpdates.sort((a, b) => b.update.timestamp - a.update.timestamp);
    const recentUpdates = allUpdates.slice(0, 5);

    // Get tasks (using React Query's allTasks)
    let userTasks = allTasks;

    const recentTasks = [...userTasks]
      .filter(t => t.status !== 'Done')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);
      
    const upcomingDeadlines = userTasks.filter(t => {
      if (!t.dueDate || t.status === 'Done') return false;
      const dueDate = new Date(t.dueDate);
      const today = startOfDay(new Date());
      // Due in the next 7 days
      const daysDiff = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
      return daysDiff >= 0 && daysDiff <= 7;
    }).length;

    return {
      activeProjectsCount,
      completedProjectsCount,
      onHoldProjectsCount,
      recentTasks,
      upcomingDeadlines,
      recentUpdates
    };
  }, [projects, allTasks, profile]);

  if (loadingProjects || loadingAllTasks) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }
"""

content = re.sub(r'export default function Dashboard\(\) \{.*?(?=  return \()', new_body, content, flags=re.DOTALL)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
