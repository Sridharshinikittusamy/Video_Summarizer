import { useNavigate } from 'react-router-dom';
import {
  FileText, Youtube, Upload,
  ExternalLink, Download, Clock, Globe,
  MoreVertical, Trash2, Eye, Zap, AlertCircle
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
    processing: { label: 'Analyzing', variant: 'indigo', icon: RefreshIcon },
    completed: { label: 'Ready', variant: 'gold', icon: Zap },
    failed: { label: 'Error', variant: 'error', icon: AlertCircle },
  };

  const { label, variant, icon: StatusIcon } = statusConfig[task.status] || statusConfig.pending;

  if (!isGrid) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-wood-900/40 hover:bg-wood-900/80 border border-white/5 hover:border-accent-gold/20 rounded-2xl p-4 transition-all"
      >
        <div className="flex items-center gap-6">
          {/* Selection Indicator */}
          {(selectionMode || isSelected) && (
            <div
              onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-accent-gold border-accent-gold shadow-lg shadow-accent-gold/40' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
            >
              {isSelected && <div className="w-2 h-2 bg-wood-950 rounded-full animate-pulse" />}
            </div>
          )}

          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${task.status === 'completed' ? 'bg-accent-gold/10 border-accent-gold/20' : 'bg-white/5 border-white/5'}`}>
            {task.input_type === 'youtube' ? <Youtube size={20} className="text-red-400" /> : <Upload size={20} className="text-wood-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-sm font-bold text-white truncate group-hover:text-accent-gold transition-colors">
                {task.title || 'Untitled Analysis'}
              </h3>
              <Badge variant={variant} size="sm">
                {label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black text-wood-600 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Globe size={11} /> {task.language}</span>
              <span className="w-1 h-1 rounded-full bg-wood-800" />
              <span className="flex items-center gap-1.5"><Clock size={11} /> {new Date(task.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            {task.status === 'completed' && (
              <>
                <Button
                  onClick={() => navigate(`/report/${task.id}`)}
                  variant="glass"
                  size="sm"
                  className="h-9 px-4 border-accent-gold/20 text-accent-gold hover:bg-accent-gold/10"
                  icon={Eye}
                >
                  View
                </Button>
                {task.pdf_url && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`http://localhost:8000${task.pdf_url}`, '_blank');
                    }}
                    variant="secondary"
                    size="sm"
                    className="h-9 w-9 p-0 bg-wood-800 border-white/5"
                  >
                    <Download size={14} />
                  </Button>
                )}
              </>
            )}
            <Button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-wood-500 hover:text-red-400 hover:bg-red-400/10"
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
      className={`group cursor-pointer border-white/5 hover:border-accent-gold/30 transition-all flex flex-col h-full bg-wood-900/40 relative overflow-hidden shadow-2xl shadow-black/50`}
      padding="none"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {task.input_type === 'youtube' ? <Youtube size={80} className="text-accent-gold" /> : <Upload size={80} className="text-accent-gold" />}
      </div>

      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              {task.input_type === 'youtube' ? <Youtube size={16} className="text-red-500" /> : <Upload size={16} className="text-wood-400" />}
            </div>
            <Badge variant={variant}>{label}</Badge>
          </div>
          <span className="text-[10px] font-black text-wood-600 uppercase tracking-widest">
            #{task.id.slice(0, 4)}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-accent-gold transition-colors">
          {task.title || 'In-Progress Analysis...'}
        </h3>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-wood-500 uppercase tracking-widest">
            <Globe size={11} /> {task.language}
          </div>
          <div className="h-1 w-1 rounded-full bg-wood-800" />
          <div className="flex items-center gap-1.5 text-[10px] font-black text-wood-500 uppercase tracking-widest">
            <Clock size={11} /> {new Date(task.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.2em]">
          {task.status === 'completed' ? 'Access Report' : 'Processing...'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-wood-600 hover:text-red-500 hover:bg-red-500/10"
            icon={Trash2}
          />
          {task.status === 'completed' && (
            <>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-accent-gold" icon={Eye} />
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`http://localhost:8000${task.pdf_url}`, '_blank');
                }}
                size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-accent-gold" icon={Download}
              />
            </>
          )}
        </div>
      </div>

      {/* Grid Selection Indicator */}
      {(selectionMode || isSelected) && (
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}
          className={`absolute top-4 left-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all z-20 ${isSelected ? 'bg-accent-gold border-accent-gold shadow-lg shadow-accent-gold/40' : 'bg-wood-900/80 border-white/10 hover:border-white/30 backdrop-blur-md'}`}
        >
          {isSelected && <div className="w-2 h-2 bg-wood-950 rounded-full animate-pulse" />}
        </div>
      )}
    </Card>
  );
}

function RefreshIcon({ size, className }) {
  return <div className={`animate-spin ${className}`}><Clock size={size} /></div>;
}
