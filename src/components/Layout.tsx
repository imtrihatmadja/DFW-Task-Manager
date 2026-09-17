import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';

export default function Layout() {
  const { subscribeToProjects, subscribeToAllTasks, subscribeToPortfolios } = useProjectStore();
  const { subscribeToUsers, fetchUsers } = useUserStore();

  // Global realtime data listeners: ensures all tasks, projects, comments & users sync across all active tabs/browsers
  useEffect(() => {
    fetchUsers();
    const unsubProjects = subscribeToProjects();
    const unsubTasks = subscribeToAllTasks();
    const unsubPortfolios = subscribeToPortfolios();
    const unsubUsers = subscribeToUsers();

    return () => {
      unsubProjects();
      unsubTasks();
      unsubPortfolios();
      unsubUsers();
    };
  }, [subscribeToProjects, subscribeToAllTasks, subscribeToPortfolios, subscribeToUsers, fetchUsers]);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto outline-none focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}
