import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import {
  RefreshCw, LayoutList, Grip, Search, Plus, Filter, X, Trash2, CheckSquare, Square
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
  const { tasks, loading, refreshTasks } = useTasks();

  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    language: 'all',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null });

  const filteredTasks = tasks?.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.input_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeFilters.status === 'all' || t.status === activeFilters.status;
    const matchesLanguage = activeFilters.language === 'all' || t.language === activeFilters.language;
    return matchesSearch && matchesStatus && matchesLanguage;
  }) || [];

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(selectedIds.length === filteredTasks.length ? [] : filteredTasks.map(t => t.id));

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
      isOpen: true, type: 'bulk', id: null,
      title: `Delete ${selectedIds.length} Analyses?`,
      message: `You are about to permanently delete ${selectedIds.length} analyses and their associated files.`
    });
  };

  const confirmDelete = async () => {
    if (modalConfig.type === 'single') {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/tasks/${modalConfig.id}`, { method: 'DELETE' });
        if (res.ok) {
          refreshTasks();
          setSelectedIds(prev => prev.filter(i => i !== modalConfig.id));
        }
      } catch (err) { console.error("Deletion failed:", err); }
    } else if (modalConfig.type === 'bulk') {
      try {
        await Promise.all(selectedIds.map(id => fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/tasks/${id}`, { method: 'DELETE' })));
        setSelectedIds([]);
        refreshTasks();
      } catch (err) { console.error("Bulk deletion failed:", err); }
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const languages = [...new Set(tasks?.map(t => t.language) || [])];

  return (
    <div className="pb-24">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-surface-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-sm text-surface-500 dark:text-wood-400 mt-1">Manage and view your video summaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            as={Link}
            to="/new"
            variant="primary"
            icon={Plus}
          >
            New Analysis
          </Button>
          <Button
            variant="secondary"
            onClick={() => refreshTasks()}
            loading={loading}
            className="w-10 h-10 p-0"
          >
            {!loading && <RefreshCw size={18} className="text-surface-600 dark:text-wood-400" />}
          </Button>
        </div>
      </div>

      {/* Constraints & Controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 dark:text-wood-600 group-focus-within:text-indigo-500 dark:group-focus-within:text-accent-gold" size={18} />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-wood-950/40 border border-brand-100 dark:border-brand-500/10 rounded-xl py-3 pl-11 pr-4 text-brand-900 dark:text-white placeholder-brand-300 dark:placeholder-wood-700 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-2.5 bg-white dark:bg-wood-900/40 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${(activeFilters.status !== 'all' || activeFilters.language !== 'all' || isFilterOpen) ? 'border-brand-300 text-brand-600 dark:border-brand-500/50 dark:text-brand-500' : 'border-surface-200 text-surface-700 hover:bg-surface-50 dark:border-white/5 dark:text-wood-300 dark:hover:bg-white/5'}`}
            >
              <Filter size={16} /> Filters
            </button>
            <div className="flex bg-brand-50/50 dark:bg-wood-950/60 p-1 rounded-xl border border-brand-100 dark:border-brand-500/10">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-wood-900 shadow-md text-brand-600 dark:text-brand-500' : 'text-brand-400 dark:text-wood-600 hover:text-brand-600 dark:hover:text-brand-400'}`}
              >
                <LayoutList size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-wood-900 shadow-md text-brand-600 dark:text-brand-500' : 'text-brand-400 dark:text-wood-600 hover:text-brand-600 dark:hover:text-brand-400'}`}
              >
                <Grip size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel Open */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-wood-900/40 border border-surface-200 dark:border-white/5 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm dark:shadow-none dark:glass-panel">
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 dark:text-wood-600 uppercase tracking-wider mb-3">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'completed', 'processing', 'failed'].map(s => (
                      <button
                        key={s}
                        onClick={() => setActiveFilters(f => ({ ...f, status: s }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${activeFilters.status === s ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-500' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50 dark:bg-transparent dark:border-white/5 dark:text-wood-400 dark:hover:bg-white/5'}`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 dark:text-wood-600 uppercase tracking-wider mb-3">Language</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveFilters(f => ({ ...f, language: 'all' }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${activeFilters.language === 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-accent-gold/10 dark:border-accent-gold/20 dark:text-accent-gold' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50 dark:bg-transparent dark:border-white/5 dark:text-wood-400 dark:hover:bg-white/5'}`}
                    >
                      All Languages
                    </button>
                    {languages.map(l => (
                      <button
                        key={l}
                        onClick={() => setActiveFilters(f => ({ ...f, language: l }))}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${activeFilters.language === l ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-500' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50 dark:bg-transparent dark:border-white/5 dark:text-wood-400 dark:hover:bg-white/5'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task List/Grid */}
      <AnimatePresence mode="wait">
        {loading && !tasks ? (
          <motion.div key="loader" className="flex flex-col items-center justify-center py-32">
            <Spinner size="md" className="mb-4" />
            <p className="text-surface-500 dark:text-wood-500 text-sm font-medium">Loading analyses...</p>
          </motion.div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            key="empty"
            title="No Analyses Found"
            message="We couldn't find anything matching your filters."
            actionVisible={!searchQuery && activeFilters.status === 'all'}
          />
        ) : (
          <motion.div
            key="results"
            layout
            className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}
          >
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                viewMode={viewMode}
                isSelected={selectedIds.includes(task.id)}
                onSelect={toggleSelect}
                onDelete={handleDelete}
                selectionMode={selectedIds.length > 0}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Selection Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl"
          >
            <div className="bg-white dark:bg-wood-900 border border-surface-200 dark:border-white/10 rounded-xl p-3 shadow-2xl dark:shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="w-9 h-9 rounded-lg hover:bg-surface-100 dark:hover:bg-white/5 flex items-center justify-center text-surface-500 dark:text-wood-400 transition-colors"
                >
                  {selectedIds.length === filteredTasks.length ? <Square size={18} className="fill-brand-500 dark:fill-brand-500 text-brand-600 dark:text-wood-950 border-none rounded-sm" /> : <CheckSquare size={18} />}
                </button>
                <div className="text-sm font-medium text-surface-900 dark:text-white">{selectedIds.length} items selected</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedIds([])} className="text-surface-500 hover:text-surface-900">
                  Cancel
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={handleBulkDelete}>
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
