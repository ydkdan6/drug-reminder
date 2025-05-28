import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Home, LogOut, Pill, Settings, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-md hidden md:block">
            <div className="flex items-center justify-center h-16 border-b">
              <Link to="/" className="flex items-center">
                <Bell className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">MedRemind</span>
              </Link>
            </div>
            <nav className="p-4 space-y-1">
              <Link
                to="/"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link
                to="/medications"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  isActive('/medications') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Pill className="h-5 w-5 mr-3" />
                Medications
              </Link>
              <Link
                to="/profile"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  isActive('/profile') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="h-5 w-5 mr-3" />
                Profile
              </Link>
              <Link
                to="/settings"
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                  isActive('/settings') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Link>
              <button
                onClick={() => logout()}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            </nav>
          </aside>

          {/* Mobile header */}
          <div className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm md:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <Link to="/" className="flex items-center">
                <Bell className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">MedRemind</span>
              </Link>
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button className="text-gray-500 focus:outline-none">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile navigation */}
          <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t md:hidden">
            <div className="flex justify-around">
              <Link to="/" className={`flex flex-col items-center py-2 ${isActive('/') ? 'text-blue-600' : 'text-gray-600'}`}>
                <Home className="h-6 w-6" />
                <span className="text-xs mt-1">Dashboard</span>
              </Link>
              <Link to="/medications" className={`flex flex-col items-center py-2 ${isActive('/medications') ? 'text-blue-600' : 'text-gray-600'}`}>
                <Pill className="h-6 w-6" />
                <span className="text-xs mt-1">Medications</span>
              </Link>
              <Link to="/profile" className={`flex flex-col items-center py-2 ${isActive('/profile') ? 'text-blue-600' : 'text-gray-600'}`}>
                <User className="h-6 w-6" />
                <span className="text-xs mt-1">Profile</span>
              </Link>
              <Link to="/settings" className={`flex flex-col items-center py-2 ${isActive('/settings') ? 'text-blue-600' : 'text-gray-600'}`}>
                <Settings className="h-6 w-6" />
                <span className="text-xs mt-1">Settings</span>
              </Link>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 p-4 md:ml-64 pt-16 md:pt-4">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  );
};

export default Layout;