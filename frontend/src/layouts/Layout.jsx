import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Settings,
  Sparkles, Zap, Bell, User, LogOut, ChevronRight, Menu, X, Shield
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
    <div className="min-h-screen bg-wood-950 text-wood-200 selection:bg-accent-gold/30 flex overflow-x-hidden bg-mesh">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-accent-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-wood-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Industrial Sidebar - Highest Z-Index */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] bg-wood-900 border-r border-white/5 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-20'} hidden md:flex flex-col shadow-2xl shadow-black`}
      >
        <div className="p-6 mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group overflow-hidden">
            <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center shadow-lg shadow-accent-gold/20 shrink-0">
              <Sparkles size={20} className="text-wood-950" />
            </div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-black text-xl tracking-tighter text-white italic whitespace-nowrap"
                >
                  AI <span className="text-accent-gold">SUMMARIZER</span>
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
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-accent-gold text-wood-950 shadow-lg shadow-accent-gold/20 font-bold' : 'text-wood-500 hover:bg-white/5 hover:text-wood-200'}`}
              >
                <Icon size={20} className={isActive ? 'text-wood-950' : 'group-hover:text-accent-gold transition-colors'} />
                {isSidebarOpen && (
                  <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
          <Link to="/profile" className="flex items-center gap-4 p-3 rounded-2xl border border-white/5 hover:bg-white/5 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-gold to-wood-700 flex items-center justify-center text-white shrink-0 shadow-lg">
              <User size={18} />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <div className="text-[10px] font-black text-white uppercase truncate tracking-tight">Access Node 01</div>
                <div className="text-[9px] font-bold text-wood-500 uppercase tracking-tighter">System Authenticated</div>
              </div>
            )}
          </Link>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-wood-800 rounded-full border border-white/10 flex items-center justify-center text-wood-400 shadow-xl hover:text-accent-gold hover:scale-110 transition-all hidden lg:flex"
        >
          {isSidebarOpen ? <X size={10} /> : <Menu size={10} />}
        </button>
      </aside>

      {/* Main Content Area - Z-Index lower than Sidebar but manages Top Bar */}
      <div
        className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${isSidebarOpen ? 'md:ml-72' : 'md:ml-20'}`}
      >
        {/* Industry Top Bar - Secondary Z-Index */}
        <header className="sticky top-0 z-[50] w-full px-6 py-4 bg-wood-950/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between">
          <div className="md:hidden">
            <button className="p-2.5 bg-wood-800 border border-white/10 rounded-xl text-white">
              <Menu size={20} />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-wood-500 uppercase tracking-[0.2em] italic">
            <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
            Neural Link Optimized
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-lg text-wood-400 hover:text-accent-gold hover:bg-white/5">
                <Bell size={18} />
              </Button>
              <Link to="/profile" className="flex items-center gap-2 pr-3 pl-1 py-1 hover:bg-white/5 rounded-lg transition-colors group">
                <div className="w-7 h-7 bg-accent-gold rounded-md flex items-center justify-center text-wood-950">
                  <User size={14} />
                </div>
                <span className="text-[10px] font-black text-wood-400 group-hover:text-white uppercase tracking-widest hidden sm:block">Settings Node</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content Lane */}
        <main className="relative z-10 flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto page-transition">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
