import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Youtube, Upload, Globe,
  Sparkles, CheckCircle2, AlertCircle, Video,
  Clock, Database, Brain, Play, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';

export default function CreateTask() {
  const { user } = useAuth();
  const { refreshTasks } = useTasks();
  const navigate = useNavigate();
  const [inputType, setInputType] = useState('youtube'); // 'youtube', 'file'
  const [sourceValue, setSourceValue] = useState('');
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('Tamil');

  // Progress State
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null); // 'pending', 'processing', 'completed', 'failed'
  const [errorMsg, setErrorMsg] = useState(null);

  const { loading: submitting, request: startAnalysis } = useApi(`${import.meta.env.VITE_API_BASE_URL}/analyze/${inputType}`, {
    method: 'POST',
    manual: true
  });

  // Polling for progress
  useEffect(() => {
    if (!activeTaskId || taskStatus === 'completed' || taskStatus === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/tasks/${activeTaskId}`);
        const data = await res.json();
        setTaskStatus(data.status);
        if (data.status === 'failed') setErrorMsg(data.error_msg);

        if (data.status === 'completed') {
          refreshTasks();
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTaskId, taskStatus, refreshTasks]);

  const handleSubmit = async () => {
    try {
      setErrorMsg(null);
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('language', language);

      if (inputType === 'youtube') {
        if (!sourceValue) throw new Error("Please enter a valid YouTube URL");
        formData.append('url', sourceValue);
      } else {
        if (!file) throw new Error("Please upload a video file");
        formData.append('file', file);
      }

      const res = await startAnalysis({ body: formData });
      if (res.task_id) {
        setActiveTaskId(res.task_id);
        setTaskStatus('pending');
        refreshTasks();
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const CORE_LANGS = ["Tamil", "English", "Hindi", "Malayalam", "Telugu", "French", "Spanish"];
  const ALL_LANGS = [
    "Arabic", "Chinese", "German", "Italian", "Japanese", "Korean", "Portuguese", "Russian"
  ].sort();
  const [showAllLangs, setShowAllLangs] = useState(false);

  const ProgressHub = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 max-w-3xl mx-auto"
    >
      <Card className="p-8 relative overflow-hidden bg-white dark:bg-wood-950 shadow-lg dark:shadow-none border-surface-200 dark:border-white/5 dark:glass-panel">
        <div className="absolute top-0 left-0 w-full h-1 bg-surface-100 dark:bg-white/5">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: taskStatus === 'processing' ? '60%' : taskStatus === 'completed' ? '100%' : '10%' }}
            className={`h-full ${taskStatus === 'failed' ? 'bg-red-500' : 'bg-brand-500 dark:bg-brand-500'}`}
            transition={{ duration: 2 }}
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mt-2">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              {taskStatus === 'completed' ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
              ) : taskStatus === 'failed' ? (
                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-1">
                {taskStatus === 'pending' ? 'Initializing Pipeline...' :
                  taskStatus === 'processing' ? 'Synthesizing Data' :
                    taskStatus === 'completed' ? 'Analysis Complete' : 'System Error'}
              </h3>
              <p className="text-surface-500 dark:text-wood-400 text-sm font-medium">
                Target Language: {language}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            {taskStatus === 'completed' ? (
              <Button as={Link} to={`/report/${activeTaskId}`} variant="primary" icon={ExternalLink} className="shadow-sm">
                View Report
              </Button>
            ) : taskStatus === 'failed' ? (
              <Button onClick={() => { setActiveTaskId(null); setTaskStatus(null) }} variant="danger">
                Retry Setup
              </Button>
            ) : (
              <div className="px-4 py-2 bg-surface-50 dark:bg-wood-950 border border-surface-200 dark:border-white/5 rounded-lg flex items-center gap-2">
                <Clock size={16} className="text-brand-500 dark:text-brand-500 animate-pulse" />
                <span className="text-xs font-semibold text-surface-600 dark:text-wood-500">Processing</span>
              </div>
            ) || null}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-lg flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-surface-100 dark:border-white/5">
          <div className={`p-4 rounded-xl border transition-all ${taskStatus === 'pending' ? 'bg-brand-50 border-brand-200 dark:bg-brand-500/5 dark:border-brand-500/20' : 'bg-surface-50 border-surface-100 dark:bg-wood-900/40 dark:border-white/5'}`}>
            <Database size={16} className={taskStatus === 'pending' ? 'text-brand-600 dark:text-brand-500 mb-2' : 'text-surface-400 dark:text-wood-600 mb-2'} />
            <div className="text-xs font-semibold text-surface-600 dark:text-wood-400">Ingestion</div>
          </div>
          <div className={`p-4 rounded-xl border transition-all ${taskStatus === 'processing' ? 'bg-brand-50 border-brand-200 dark:bg-brand-500/5 dark:border-brand-500/20' : 'bg-surface-50 border-surface-100 dark:bg-wood-900/40 dark:border-white/5'}`}>
            <Brain size={16} className={taskStatus === 'processing' ? 'text-brand-600 dark:text-brand-500 mb-2' : 'text-surface-400 dark:text-wood-600 mb-2'} />
            <div className="text-xs font-semibold text-surface-600 dark:text-wood-400">Intelligence</div>
          </div>
          <div className={`p-4 rounded-xl border transition-all ${taskStatus === 'completed' ? 'bg-brand-50 border-brand-200 dark:bg-brand-500/5 dark:border-brand-500/20' : 'bg-surface-50 border-surface-100 dark:bg-wood-900/40 dark:border-white/5'}`}>
            <Play size={16} className={taskStatus === 'completed' ? 'text-brand-600 dark:text-brand-500 mb-2' : 'text-surface-400 dark:text-wood-600 mb-2'} />
            <div className="text-xs font-semibold text-surface-600 dark:text-wood-400">Output</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 md:px-8">
      {/* Header */}
      <div className="mb-10 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-3 rounded-2xl bg-white dark:bg-wood-950 border border-brand-100 dark:border-brand-500/10 text-brand-600 dark:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all shadow-sm group"
          title="Back to Dashboard"
        >
          <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-brand-900 dark:text-white">
            New Analysis
          </h1>
          <p className="text-brand-500/60 dark:text-wood-400 text-sm font-medium">
            Launch a specialized synthetic intelligence pipeline
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!activeTaskId ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left: Input Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-2 bg-white dark:bg-wood-950/40 border-brand-100 dark:border-brand-500/10 shadow-sm dark:shadow-none">
                <div className="flex gap-2">
                  <button
                    onClick={() => { setInputType('youtube'); setSourceValue('') }}
                    style={inputType === 'youtube' ? { backgroundColor: '#D4A373' } : {}}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all text-sm font-bold ${inputType === 'youtube' ? 'text-white shadow-lg shadow-brand-500/30' : 'bg-transparent text-brand-500/60 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50'}`}
                  >
                    <Youtube size={18} /> YouTube URL
                  </button>
                  <button
                    onClick={() => { setInputType('file'); setSourceValue('') }}
                    style={inputType === 'file' ? { backgroundColor: '#D4A373' } : {}}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all text-sm font-bold ${inputType === 'file' ? 'text-white shadow-lg shadow-brand-500/30' : 'bg-transparent text-brand-500/60 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50'}`}
                  >
                    <Video size={18} /> File Upload
                  </button>
                </div>
              </Card>

              <Card className="p-8 border-surface-200 shadow-sm">
                <AnimatePresence mode="wait">
                  {inputType === 'youtube' ? (
                    <motion.div key="youtube" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-surface-700 dark:text-wood-300 mb-2">YouTube Link</label>
                        <div className="relative group">
                          <input
                            type="url"
                            placeholder="https://youtube.com/watch?v=..."
                            value={sourceValue}
                            onChange={(e) => setSourceValue(e.target.value)}
                            className="w-full bg-white dark:bg-wood-950/60 border-2 border-brand-50 dark:border-brand-500/10 rounded-2xl p-4 pl-12 text-brand-900 dark:text-white placeholder-brand-200 dark:placeholder-wood-700 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-semibold text-sm"
                          />
                          <Youtube size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300 dark:text-brand-500 group-focus-within:text-brand-500" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-brand-900 dark:text-wood-300 mb-2">Upload File</label>
                        <div className="relative border-2 border-dashed border-brand-100 dark:border-brand-500/20 bg-brand-50/50 dark:bg-wood-950/40 rounded-2xl p-10 flex flex-col items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all cursor-pointer group">
                          {file ? (
                            <div className="flex flex-col items-center text-center">
                              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-500/10 rounded-xl flex items-center justify-center mb-3">
                                <Video size={24} className="text-brand-600 dark:text-brand-500" />
                              </div>
                              <p className="text-surface-900 dark:text-white font-medium text-sm mb-1 max-w-[200px] truncate">{file.name}</p>
                              <button onClick={(e) => { e.preventDefault(); setFile(null) }} className="text-xs font-semibold text-red-500 hover:text-red-700">
                                Remove Element
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload size={32} className="text-surface-400 dark:text-wood-600 mb-3" />
                              <p className="text-surface-900 dark:text-wood-200 font-medium text-sm mb-1">Click to Upload</p>
                              <p className="text-xs text-surface-500 dark:text-wood-500">MP4 matching constraints</p>
                              <input
                                type="file"
                                accept="video/mp4"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 pt-8 border-t border-surface-100 dark:border-white/5">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={(inputType === 'youtube' ? !sourceValue : !file) || submitting}
                    onClick={handleSubmit}
                    className="w-full h-14"
                  >
                    {submitting ? <Spinner size="sm" /> : <><Sparkles size={18} /> Generate Summary</>}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right: Settings Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 h-full shadow-sm border-surface-200">
                <div className="flex items-center gap-2 mb-6 text-sm font-semibold text-surface-900 dark:text-white pb-4 border-b border-surface-100 dark:border-white/5">
                  <Globe size={16} className="text-brand-600 dark:text-brand-500" />
                  Target Language
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {CORE_LANGS.filter(Boolean).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        style={language === lang ? { backgroundColor: '#B88B5D' } : {}}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${language === lang ? 'border-brand-600 text-white shadow-sm' : 'bg-white border-brand-100 text-brand-700/60 hover:bg-brand-50 dark:bg-transparent dark:border-brand-500/10 dark:text-brand-400'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowAllLangs(!showAllLangs)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border border-transparent text-brand-600 dark:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10`}
                  >
                    {showAllLangs ? "Less Options" : "+ More Languages"}
                  </button>

                  <AnimatePresence>
                    {showAllLangs && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 pt-2 overflow-hidden"
                      >
                        {ALL_LANGS.filter(Boolean).map(lang => (
                          <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            style={language === lang ? { backgroundColor: '#B88B5D' } : {}}
                            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${language === lang ? 'border-brand-600 text-white shadow-sm' : 'bg-white border-brand-100 text-brand-700/60 hover:bg-brand-50 dark:bg-transparent dark:border-brand-500/10 dark:text-brand-400'}`}
                          >
                            {lang}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </div>
          </motion.div>
        ) : (
          <ProgressHub />
        )}
      </AnimatePresence>
    </div>
  );
}
