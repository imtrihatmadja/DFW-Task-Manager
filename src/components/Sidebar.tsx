import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  FolderKanban, 
  Layers, 
  BarChart2, 
  Users,
  Settings,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { logOut } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { name: 'Home', to: '/', icon: Home },
  { name: 'My Tasks', to: '/tasks', icon: CheckSquare },
  { name: 'Projects', to: '/projects', icon: FolderKanban },
  { name: 'Portfolios', to: '/portfolios', icon: Layers },
  { name: 'Reporting', to: '/reporting', icon: BarChart2 },
  { name: 'Team', to: '/team', icon: Users },
];

export default function Sidebar() {
  const profile = useAuthStore(state => state.profile);

  return (
    <div className="flex flex-col w-64 bg-gray-50 border-r border-gray-200 h-screen">
      <div className="p-4 flex items-center space-x-2 border-b border-gray-200">
        <div className="w-8 h-8 bg-teal-600 text-white rounded-md flex items-center justify-center font-bold text-lg">
          D
        </div>
        <span className="font-bold text-gray-900 truncate">DFW Monev Hub</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="h-8 w-8 rounded-full" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
              {profile?.displayName?.charAt(0) || 'U'}
            </div>
          )}
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {profile?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => logOut()}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          Sign out
        </button>
      </div>
    </div>
  );
}
