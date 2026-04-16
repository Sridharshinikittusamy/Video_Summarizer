import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Settings,
  Sparkles, Bell, User, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Button from '../components/ui/Button';

export default function Layout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'New Analysis', path: '/new', icon: PlusCircle },
    { name: 'Settings', path: '/profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#0B0905] text-surface-900 dark:text-white flex overflow-x-hidden transition-colors">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-wood-950 border-r border-brand-100 dark:border-brand-500/10 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col shadow-sm`}
      >
        <div className="p-6 mb-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-semibold text-lg tracking-tight text-surface-900 dark:text-white whitespace-nowrap"
                >
                  Neural Core
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative ${isActive ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-500 font-semibold shadow-sm' : 'text-surface-500 dark:text-wood-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 hover:text-brand-600 dark:hover:text-brand-400'}`}
              >
                {isActive && <div className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full shadow-[0_0_8px_rgba(212,163,115,0.8)]" />}
                <Icon size={20} className={isActive ? 'text-brand-600 dark:text-brand-500' : 'group-hover:text-brand-500 transition-colors'} />
                {isSidebarOpen && (
                  <span className="text-sm">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-50 dark:border-brand-500/10 bg-brand-50/30 dark:bg-transparent">
          <Link to="/profile" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/60 dark:hover:bg-brand-500/5 transition-all group">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20">
              <User size={18} className="text-white" />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <div className="text-sm font-semibold text-brand-900 dark:text-brand-500 truncate">System Admin</div>
                <div className="text-xs text-brand-600/60 dark:text-wood-500 truncate">Config Workspace</div>
              </div>
            )}
          </Link>
        </div>

        {/* Desktop Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-wood-900 border border-surface-200 dark:border-white/10 rounded-full flex items-center justify-center text-surface-500 dark:text-wood-400 shadow-sm hover:text-brand-600 dark:hover:text-brand-500 transition-colors hidden lg:flex"
        >
          {isSidebarOpen ? <X size={12} /> : <Menu size={12} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}
      >
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 w-full px-6 py-4 bg-white/70 dark:bg-wood-950/40 backdrop-blur-xl border-b border-brand-100 dark:border-brand-500/10 flex items-center justify-between transition-all">
          <div className="md:hidden">
            <button className="p-2 bg-surface-100 dark:bg-white/5 border border-surface-200 dark:border-white/10 rounded-lg text-surface-900 dark:text-white">
              <Menu size={20} />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-100 dark:border-brand-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            System Online
          </div>

          <div className="flex items-center gap-4">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-surface-500 dark:text-wood-500 hover:bg-surface-100 dark:hover:bg-white/10 transition-colors">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Page Content Lane */}
        <main className="relative z-10 flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto page-transition">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
