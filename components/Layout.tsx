
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Settings,
  Menu,
  ClipboardList,
  Stethoscope,
  LogOut,
  Moon,
  Sun,
  AlertCircle
} from 'lucide-react';
import { db } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Safe access to doctor name with optional chaining
  const profile = db.getDoctorProfile();
  const doctorName = profile?.name || 'Docteur';

  useEffect(() => {
    alert("v2.4 - Amélioration gestion PDF");
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const navItems = [
    { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/consultations', label: 'Consultations', icon: ClipboardList },
    { path: '/patients', label: 'Patients', icon: Users },
    { path: '/appointments', label: 'Rendez-vous', icon: Calendar },
    { path: '/prescriptions', label: 'Documents', icon: FileText },
    { path: '/settings', label: 'Paramètres', icon: Settings },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 dark:bg-slate-950 text-white transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-800
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center h-16 px-6 bg-slate-800 dark:bg-slate-950 border-b border-slate-700 flex-shrink-0">
          <Stethoscope className="w-8 h-8 text-teal-400 mr-3" />
          <span className="text-xl font-bold tracking-tight">MediCab Pro</span>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-lg transition-colors
                ${isActive
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900 dark:bg-slate-950 flex-shrink-0 space-y-3">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5 mr-3 text-yellow-400" /> : <Moon className="w-5 h-5 mr-3 text-blue-300" />}
            <span className="font-medium">{isDarkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Déconnexion</span>
          </button>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
              Dr
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{doctorName.split(' ').slice(0, 2).join(' ')}</p>
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">En ligne</p>
                <p className="text-[10px] text-slate-600">v2.4</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center px-4 justify-between flex-shrink-0 transition-colors">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            <span className="font-bold text-gray-800 dark:text-white">MediCab</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-gray-50 dark:bg-slate-900 transition-colors">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <LogOut size={20} className="text-red-500" />
              Déconnexion
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Voulez-vous vraiment vous déconnecter et retourner à l'écran d'accueil ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-red-600/20"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
