import { useNavigate } from 'react-router-dom';
import {
  Youtube, Upload, Download, Clock, Globe, Trash2, Eye, Zap, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';
import Card from './ui/Card';
import Button from './ui/Button';

export default function TaskItem({
  task,
  viewMode,
  isSelected,
  onSelect,
  onDelete,
  selectionMode
}) {
  const navigate = useNavigate();
  const isGrid = viewMode === 'grid';

  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning', icon: Clock },
    processing: { label: 'Analyzing', variant: 'brand', icon: RefreshIcon },
    completed: { label: 'Ready', variant: 'success', icon: Zap },
    failed: { label: 'Error', variant: 'error', icon: AlertCircle },
  };

  const { label, variant } = statusConfig[task.status] || statusConfig.pending;

  if (!isGrid) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-white dark:bg-wood-900/40 hover:bg-surface-50 dark:hover:bg-wood-800/40 border border-surface-200 dark:border-white/5 hover:border-surface-300 dark:hover:border-white/10 rounded-xl p-4 transition-all"
      >
        <div className="flex items-center gap-6">
          {/* Selection Indicator */}
          {(selectionMode || isSelected) && (
            <div
              onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}
              className={`w-5 h-5 rounded border flex flex-shrink-0 items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-brand-500 border-brand-500 dark:bg-brand-500 dark:border-brand-500' : 'bg-white dark:bg-wood-900 border-surface-300 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-500/40'}`}
            >
              {isSelected && <div className="w-2 h-2 bg-white dark:bg-wood-950 rounded-full" />}
            </div>
          )}

          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-surface-100 dark:border-white/5 bg-surface-50 dark:bg-wood-950">
            {task.input_type === 'youtube' ? <Youtube size={18} className="text-red-500" /> : <Upload size={18} className="text-surface-500 dark:text-wood-500" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                {task.title || 'Untitled Analysis'}
              </h3>
              <Badge variant={variant} size="sm">
                {label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-surface-500 dark:text-wood-400 font-medium">
              <span className="flex items-center gap-1.5"><Globe size={12} /> {task.language}</span>
              <span className="w-1 h-1 rounded-full bg-surface-300 dark:bg-wood-700" />
              <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(task.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
            {task.status === 'completed' && (
              <>
                <Button
                  onClick={() => navigate(`/report/${task.id}`)}
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                >
                  View
                </Button>
                {task.pdf_url && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`${import.meta.env.VITE_API_BASE_URL}${task.pdf_url}`, '_blank');
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0"
                  >
                    <Download size={16} />
                  </Button>
                )}
              </>
            )}
            <Button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              icon={Trash2}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <Card
      onClick={() => task.status === 'completed' && navigate(`/report/${task.id}`)}
      hover={true}
      className={`group cursor-pointer flex flex-col h-full relative overflow-hidden`}
      padding="none"
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-surface-50 dark:bg-wood-950 border border-surface-100 dark:border-white/5">
              {task.input_type === 'youtube' ? <Youtube size={16} className="text-red-500" /> : <Upload size={16} className="text-surface-500 dark:text-wood-500" />}
            </div>
            <Badge variant={variant}>{label}</Badge>
          </div>
          <span className="text-xs text-surface-400 dark:text-wood-600 font-mono tracking-wider">
            #{task.id.slice(0, 4)}
          </span>
        </div>

        <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors">
          {task.title || 'In-Progress Analysis...'}
        </h3>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-surface-100 dark:border-white/5 text-xs font-medium text-surface-500 dark:text-wood-400">
          <div className="flex items-center gap-1.5">
            <Globe size={12} /> {task.language}
          </div>
          <div className="h-1 w-1 rounded-full bg-surface-300 dark:bg-wood-700" />
          <div className="flex items-center gap-1.5">
            <Clock size={12} /> {new Date(task.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="p-4 bg-surface-50 dark:bg-wood-950/40 flex items-center justify-between border-t border-surface-100 dark:border-white/5 text-xs font-medium text-surface-600 dark:text-wood-500">
        <span>
          {task.status === 'completed' ? 'Access Report' : 'Processing...'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            size="sm"
            variant="ghost"
            className="w-7 h-7 p-0 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/10"
            icon={Trash2}
          />
          {task.status === 'completed' && (
            <>
              <Button size="sm" variant="ghost" className="w-7 h-7 p-0" icon={Eye} />
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`${import.meta.env.VITE_API_BASE_URL}${task.pdf_url}`, '_blank');
                }}
                size="sm" variant="ghost" className="w-7 h-7 p-0" icon={Download}
              />
            </>
          )}
        </div>
      </div>

      {/* Grid Selection Indicator */}
      {(selectionMode || isSelected) && (
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}
          className={`absolute top-4 right-4 w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all z-20 ${isSelected ? 'bg-brand-500 border-brand-500 dark:bg-brand-500 dark:border-brand-500 shadow-sm' : 'bg-white dark:bg-wood-900 border-surface-300 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-500/40'}`}
        >
          {isSelected && <div className="w-2 h-2 bg-white dark:bg-wood-950 rounded-full" />}
        </div>
      )}
    </Card>
  );
}

function RefreshIcon({ size, className }) {
  return <div className={`animate-spin ${className}`}><Clock size={size} /></div>;
}
