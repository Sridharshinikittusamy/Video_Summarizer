import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import {
  RefreshCw, LayoutList, Grip,
  Search, Plus, Sparkles, Clock, Globe, Video, Youtube, Filter, X,
  Trash2, CheckSquare, Square, MinusSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskItem from '../components/TaskItem';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/EmptyState';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ui/ConfirmationModal';

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, loading, error, refreshTasks } = useTasks();

  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: 'all', // 'all', 'completed', 'processing', 'failed'
    language: 'all',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null });

  // Comprehensive Filtering Logic
  const filteredTasks = tasks?.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.input_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = activeFilters.status === 'all' || t.status === activeFilters.status;
    const matchesLanguage = activeFilters.language === 'all' || t.language === activeFilters.language;

    return matchesSearch && matchesStatus && matchesLanguage;
  }) || [];

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map(t => t.id));
    }
  };

  const handleDelete = async (id) => {
    setModalConfig({
      isOpen: true,
      type: 'single',
      id,
      title: "Delete Analysis?",
      message: "This will permanently remove this analysis and all associated files. This action cannot be undone."
    });
  };

  const handleBulkDelete = async () => {
    setModalConfig({
      isOpen: true,
      type: 'bulk',
      id: null,
      title: `Delete ${selectedIds.length} Analyses?`,
      message: `You are about to permanently delete ${selectedIds.length} analyses and their associated files.`
    });
  };

  const confirmDelete = async () => {
    if (modalConfig.type === 'single') {
      try {
        const res = await fetch(`http://localhost:8000/analyze/tasks/${modalConfig.id}`, { method: 'DELETE' });
        if (res.ok) {
          refreshTasks();
          setSelectedIds(prev => prev.filter(i => i !== modalConfig.id));
        }
      } catch (err) {
        console.error("Deletion failed:", err);
      }
    } else if (modalConfig.type === 'bulk') {
      try {
        await Promise.all(
          selectedIds.map(id => fetch(`http://localhost:8000/analyze/tasks/${id}`, { method: 'DELETE' }))
        );
        setSelectedIds([]);
        refreshTasks();
      } catch (err) {
        console.error("Bulk deletion failed:", err);
      }
    }
  };

  const languages = [...new Set(tasks?.map(t => t.language) || [])];

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      {/* Header Section */}
      <div className="relative z-10 mb-10 pb-8 border-b border-white/5 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-1">
              AI <span className="text-accent-gold font-black">Summarizer</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
              <p className="text-wood-500 text-[10px] font-black uppercase tracking-widest italic">
                Analysis Live Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              as={Link}
              to="/new"
              variant="primary"
              size="lg"
              icon={Plus}
              className="px-8 shadow-2xl shadow-accent-gold/20 rounded-2xl bg-accent-gold text-wood-950 hover:bg-white transition-all font-black"
            >
              New Analysis
            </Button>
            <div className="h-10 w-px bg-white/10 mx-2 hidden md:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshTasks()}
              loading={loading}
              className="w-12 h-12 p-0 rounded-2xl bg-white/5 border border-white/5"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin text-accent-gold' : 'text-wood-400'} />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filter & Search Controls */}
      <div className="space-y-4 mb-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-wood-600 group-focus-within:text-accent-gold transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by title, source, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-wood-900/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white placeholder-wood-800 focus:outline-none focus:border-accent-gold/30 transition-all font-bold text-sm tracking-wide focus:ring-4 focus:ring-accent-gold/5"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-6 py-5 rounded-2xl border transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest ${isFilterOpen || activeFilters.status !== 'all' || activeFilters.language !== 'all' ? 'bg-accent-gold border-accent-gold-dark text-wood-950' : 'bg-white/5 border-white/5 text-wood-500 hover:text-wood-200'}`}
            >
              <Filter size={18} /> Filters {(activeFilters.status !== 'all' || activeFilters.language !== 'all') && "•"}
            </button>
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest ${viewMode === 'list' ? 'bg-accent-gold text-wood-950 shadow-lg shadow-accent-gold/20' : 'text-wood-500'}`}
              >
                <LayoutList size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest ${viewMode === 'grid' ? 'bg-accent-gold text-wood-950 shadow-lg shadow-accent-gold/20' : 'text-wood-500'}`}
              >
                <Grip size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Drawer */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-wood-900/40 border border-white/5 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-[10px] font-black text-wood-500 uppercase tracking-widest mb-4">Status Threshold</h4>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'completed', 'processing', 'failed'].map(s => (
                      <button
                        key={s}
                        onClick={() => setActiveFilters(f => ({ ...f, status: s }))}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeFilters.status === s ? 'bg-accent-gold text-wood-950 border-accent-gold' : 'bg-transparent border-white/5 text-wood-600 hover:text-wood-400'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-wood-500 uppercase tracking-widest mb-4">Target Language</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveFilters(f => ({ ...f, language: 'all' }))}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeFilters.language === 'all' ? 'bg-accent-gold text-wood-950 border-accent-gold' : 'bg-transparent border-white/5 text-wood-600 hover:text-wood-400'}`}
                    >
                      All
                    </button>
                    {languages.map(l => (
                      <button
                        key={l}
                        onClick={() => setActiveFilters(f => ({ ...f, language: l }))}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeFilters.language === l ? 'bg-accent-gold text-wood-950 border-accent-gold' : 'bg-transparent border-white/5 text-wood-600 hover:text-wood-400'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end justify-end">
                  <button
                    onClick={() => {
                      setActiveFilters({ status: 'all', language: 'all' });
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-black text-accent-gold flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    Reset Workspace <X size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {loading && !tasks ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-44 bg-wood-900/20 border border-white/5 rounded-[3rem] border-dashed"
          >
            <Spinner size="md" className="mb-6" />
            <p className="text-wood-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Records...</p>
          </motion.div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            key="empty"
            title={searchQuery || activeFilters.status !== 'all' ? "Target Not Found" : "Vault Empty"}
            message={searchQuery || activeFilters.status !== 'all' ? "No records match your current filter parameters." : "Initiating your first analysis will populate this command center."}
            actionVisible={!searchQuery && activeFilters.status === 'all'}
          />
        ) : (
          <motion.div
            key="results"
            layout
            className={viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              : "flex flex-col gap-4"
            }
          >
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                viewMode={viewMode}
                isSelected={selectedIds.includes(task.id)}
                onSelect={() => toggleSelect(task.id)}
                onDelete={handleDelete}
                selectionMode={selectedIds.length > 0}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Industrial Selection Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            <div className="bg-wood-900/90 border border-accent-gold/30 backdrop-blur-2xl rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={selectAll}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-gold hover:bg-accent-gold hover:text-wood-950 transition-all"
                >
                  {selectedIds.length === filteredTasks.length ? <MinusSquare size={18} /> : <CheckSquare size={18} />}
                </button>
                <div>
                  <div className="text-white font-black text-sm tracking-tight">{selectedIds.length} Items Selected</div>
                  <div className="text-[10px] font-black text-wood-500 uppercase tracking-widest">Bulk Management Active</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  className="text-[10px] font-black uppercase tracking-widest text-wood-400"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Trash2}
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 px-6 font-black"
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmDelete}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  );
}
