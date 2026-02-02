import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, LogOut, Settings, Layers } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { authService } from '../services/mockSupabase';
import { User } from '../types';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage
    const userStr = localStorage.getItem('nexus_user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">N</span>
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">Nexus</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <NavLink 
              to="/squads" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Users className="w-5 h-5" />
              Squads
            </NavLink>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 cursor-not-allowed">
              <Settings className="w-5 h-5" />
              Settings
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                    {user ? getInitials(user.name) : '?'}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Loading...'}</p>
                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
            </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 md:hidden">
             {/* Mobile Header content could go here */}
             <span className="font-bold text-gray-900">Nexus</span>
        </header>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  );
};