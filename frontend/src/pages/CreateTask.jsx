import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Youtube, Upload, Globe,
  Sparkles, Zap, ArrowRight, CheckCircle2,
  AlertCircle, FileAudio, Video, Search, FileText,
  X, Clock, Database, Brain, Play, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function CreateTask() {
  const { user } = useAuth();
  const { refreshTasks } = useTasks();
  const navigate = useNavigate();
  const [inputType, setInputType] = useState('youtube'); // 'youtube', 'file'
  const [sourceValue, setSourceValue] = useState('');
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('Tamil');
  const [searchLang, setSearchLang] = useState('');

  // Progress State
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null); // 'pending', 'processing', 'completed', 'failed'
  const [errorMsg, setErrorMsg] = useState(null);

  const { loading: submitting, error: submitError, request: startAnalysis } = useApi(`${import.meta.env.VITE_API_BASE_URL}/analyze/${inputType}`, {
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

        // Refresh global list when completed
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
        refreshTasks(); // Refresh global list to show pending
      }
    } catch (err) {
      console.error("Submission failed:", err);
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
      className="mt-12"
    >
      <Card className="p-10 bg-wood-900/60 border-accent-gold/20 glass-panel shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: taskStatus === 'processing' ? '60%' : taskStatus === 'completed' ? '100%' : '10%' }}
            className={`h-full ${taskStatus === 'failed' ? 'bg-red-500' : 'bg-accent-gold shadow-[0_0_15px_rgba(212,163,115,0.5)]'}`}
            transition={{ duration: 2 }}
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              {taskStatus === 'completed' ? (
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
              ) : taskStatus === 'failed' ? (
                <div className="w-20 h-20 rounded-3xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
                  <Spinner size="md" color="gold" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white italic mb-1 tracking-tight">
                {taskStatus === 'pending' ? 'Inititalizing Pipeline...' :
                  taskStatus === 'processing' ? 'Neural Synthesis Active' :
                    taskStatus === 'completed' ? 'Analysis Finalized' : 'System Error'}
              </h3>
              <p className="text-wood-500 text-[10px] font-black uppercase tracking-[0.3em]">
                {activeTaskId} • Targeted: {language}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {taskStatus === 'completed' ? (
              <Button as={Link} to={`/report/${activeTaskId}`} variant="primary" icon={ExternalLink} className="bg-accent-gold text-wood-950 font-black px-8 py-5 rounded-2xl">
                View Intelligence
              </Button>
            ) : taskStatus === 'failed' ? (
              <Button onClick={() => { setActiveTaskId(null); setTaskStatus(null) }} variant="glass" className="border-red-500/20 text-red-500">
                Retry Setup
              </Button>
            ) : (
              <div className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                <Clock size={16} className="text-accent-gold animate-pulse" />
                <span className="text-[10px] font-black text-wood-400 uppercase tracking-widest">Est. 60-90s remaining</span>
              </div>
            ) || null}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-8 p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-4">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 font-bold leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-10">
          <div className={`p-4 rounded-2xl border transition-all ${taskStatus === 'pending' ? 'bg-accent-gold/5 border-accent-gold/20' : 'bg-black/20 border-white/5'}`}>
            <Database size={14} className={taskStatus === 'pending' ? 'text-accent-gold mb-2' : 'text-wood-800 mb-2'} />
            <div className="text-[9px] font-black uppercase tracking-widest text-wood-500">Ingestion</div>
          </div>
          <div className={`p-4 rounded-2xl border transition-all ${taskStatus === 'processing' ? 'bg-accent-gold/5 border-accent-gold/20' : 'bg-black/20 border-white/5'}`}>
            <Brain size={14} className={taskStatus === 'processing' ? 'text-accent-gold mb-2' : 'text-wood-800 mb-2'} />
            <div className="text-[9px] font-black uppercase tracking-widest text-wood-500">Intelligence</div>
          </div>
          <div className={`p-4 rounded-2xl border transition-all ${taskStatus === 'completed' ? 'bg-accent-gold/5 border-accent-gold/20' : 'bg-black/20 border-white/5'}`}>
            <FileText size={14} className={taskStatus === 'completed' ? 'text-accent-gold mb-2' : 'text-wood-800 mb-2'} />
            <div className="text-[9px] font-black uppercase tracking-widest text-wood-500">Report</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="mb-12 flex flex-col items-center text-center">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} icon={ChevronLeft} className="mb-8 self-start text-wood-500 hover:text-accent-gold">
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-accent-gold animate-pulse" size={24} />
          <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.6em]">Neural Processor v2.0</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight mb-4">
          Configure <span className="text-accent-gold">Analysis</span>
        </h1>
        <p className="text-wood-500 text-sm font-medium max-w-lg">
          Transform your multimedia content into high-fidelity intelligence reports in seconds.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!activeTaskId ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left: Input Selection */}
            <div className="lg:col-span-2">
              <Card className="p-1 gap-0 bg-wood-900/40 border-white/5 shadow-2xl overflow-hidden glass-panel h-full">
                <div className="flex p-2 gap-2 bg-black/20">
                  <button
                    onClick={() => { setInputType('youtube'); setFile(null) }}
                    className={`flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl transition-all ${inputType === 'youtube' ? 'bg-accent-gold text-wood-950 font-black shadow-lg shadow-accent-gold/20' : 'text-wood-500 hover:text-wood-200 hover:bg-white/5'}`}
                  >
                    <Youtube size={20} />
                    <span className="text-xs uppercase tracking-widest">YouTube Video</span>
                  </button>
                  <button
                    onClick={() => { setInputType('file'); setSourceValue('') }}
                    className={`flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl transition-all ${inputType === 'file' ? 'bg-accent-gold text-wood-950 font-black shadow-lg shadow-accent-gold/20' : 'text-wood-500 hover:text-wood-200 hover:bg-white/5'}`}
                  >
                    <Video size={20} />
                    <span className="text-xs uppercase tracking-widest">Video Asset</span>
                  </button>
                </div>

                <div className="p-8 md:p-12">
                  <AnimatePresence mode="wait">
                    {inputType === 'youtube' ? (
                      <motion.div key="youtube" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                        <div className="relative group">
                          <input
                            type="url"
                            placeholder="Paste YouTube Link here..."
                            value={sourceValue}
                            onChange={(e) => setSourceValue(e.target.value)}
                            className="w-full bg-wood-950/60 border-2 border-white/5 rounded-[2rem] p-8 pr-20 text-xl text-white placeholder-wood-800 outline-none focus:border-accent-gold/40 transition-all font-black tracking-tight"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 text-wood-800">
                            <Youtube size={32} />
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          size="lg"
                          disabled={!sourceValue || submitting}
                          onClick={handleSubmit}
                          className="w-full h-20 rounded-3xl bg-accent-gold hover:bg-white text-wood-950 text-lg font-black tracking-[0.2em] flex items-center justify-center gap-4 transition-all"
                        >
                          {submitting ? <Spinner size="sm" /> : <><Play size={20} fill="currentColor" /> START ANALYSIS</>}
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                        <div className="relative h-64 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-8 bg-wood-950/40 group hover:border-accent-gold/40 transition-all">
                          {file ? (
                            <div className="flex flex-col items-center text-center">
                              <div className="w-16 h-16 bg-accent-gold/10 rounded-2xl flex items-center justify-center mb-4">
                                <Video size={32} className="text-accent-gold" />
                              </div>
                              <p className="text-white font-black text-xl mb-2 max-w-[300px] truncate">{file.name}</p>
                              <button onClick={() => setFile(null)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-white transition-colors">
                                Remove Video [X]
                              </button>
                            </div>
                          ) : (
                            <>
                              <Video size={48} className="text-wood-700 mb-4 group-hover:text-accent-gold transition-all" />
                              <p className="text-white font-black text-xl mb-1">Upload Video</p>
                              <p className="text-[10px] text-wood-600 font-black uppercase tracking-widest">Only .MP4 format allowed</p>
                              <input
                                type="file"
                                accept="video/mp4"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </>
                          )}
                        </div>

                        <Button
                          variant="primary"
                          size="lg"
                          disabled={!file || submitting}
                          onClick={handleSubmit}
                          className="w-full h-20 rounded-3xl bg-accent-gold hover:bg-white text-wood-950 text-lg font-black tracking-[0.2em] flex items-center justify-center gap-4 transition-all"
                        >
                          {submitting ? <Spinner size="sm" /> : <><Sparkles size={20} /> START ANALYSIS</>}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </div>

            {/* Right: Language Selection (Old Badge Design) */}
            <div className="lg:col-span-1">
              <Card className="p-8 bg-wood-900/60 border-white/5 h-full flex flex-col glass-panel shadow-xl">
                <h3 className="text-xs font-black text-wood-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                  <Globe size={14} className="text-accent-gold" /> Intelligence Output
                </h3>

                <div className="space-y-6">
                  <label className="block text-[10px] font-black text-wood-600 uppercase tracking-widest">Select Language</label>
                  <div className="flex flex-wrap gap-2">
                    {CORE_LANGS.map(lang => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`py-2 px-4 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${language === lang ? 'bg-accent-gold border-accent-gold text-wood-950 shadow-lg' : 'bg-white/5 border-white/5 text-wood-500 hover:text-wood-200 hover:bg-white/10'}`}
                      >
                        {lang}
                      </button>
                    ))}

                    <button
                      onClick={() => setShowAllLangs(!showAllLangs)}
                      className={`py-2 px-4 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${showAllLangs ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/5 text-accent-gold/60 hover:text-accent-gold'}`}
                    >
                      {showAllLangs ? "Less [-]" : "+ More"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAllLangs && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 pt-4 border-t border-white/5 overflow-hidden"
                      >
                        {ALL_LANGS.map(lang => (
                          <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`py-2 px-4 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${language === lang ? 'bg-accent-gold border-accent-gold text-wood-950 shadow-lg' : 'bg-white/5 border-white/5 text-wood-500 hover:text-wood-200 hover:bg-white/10'}`}
                          >
                            {lang}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-auto pt-8">
                  <div className="p-6 bg-accent-gold/5 border border-accent-gold/10 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={10} className="text-accent-gold" />
                      <span className="text-[9px] font-black text-accent-gold uppercase tracking-widest">Neural Mode: Active</span>
                    </div>
                    <p className="text-[9px] text-wood-600 font-bold leading-relaxed">
                      Target translation engine optimized for {language} semantics.
                    </p>
                  </div>
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
