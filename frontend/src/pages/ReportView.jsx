import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft, Download, Mail, FileText,
    Copy, Check, Clock, BookOpen, AlignLeft, Send, Sparkles, Hash,
    Image as ImageIcon, Maximize2, Trash2, HelpCircle, AlertCircle, CheckCircle2, FileAudio, Youtube, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApi } from '../hooks/useApi';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';

export default function ReportView() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'transcript', 'quiz', 'visuals'
    const [transcriptMode, setTranscriptMode] = useState('original'); // 'original' or 'translated'
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { data: task, loading: loadingTask, error: taskError } = useApi(`http://localhost:8000/analyze/tasks/${taskId}`);
    const { data: artifacts, loading: loadingArtifacts } = useApi(`http://localhost:8000/analyze/tasks/${taskId}/artifacts`);

    const loading = loadingTask || loadingArtifacts;
    const error = taskError;

    const handleCopy = () => {
        const textToCopy = activeTab === 'summary'
            ? (artifacts?.report_markdown || JSON.stringify(artifacts?.report_json, null, 2))
            : activeTab === 'transcript' ? artifacts?.raw_transcript : '';

        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = async () => {
        if (!artifacts?.pdf_url) return;
        setDownloading(true);
        try {
            const response = await fetch(`http://localhost:8000${artifacts.pdf_url}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${task.title || 'Analysis_Report'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error("PDF download failed:", err);
            window.open(`http://localhost:8000${artifacts.pdf_url}`, '_blank');
        } finally {
            setDownloading(false);
        }
    };

    const handleMail = () => {
        const subject = encodeURIComponent(`Analysis Report: ${task?.title || 'Video Session'}`);
        const summaryHead = artifacts?.report_markdown ? artifacts.report_markdown.slice(0, 500) + '...' : 'Check out the attached analysis report.';
        const body = encodeURIComponent(`Video analysis report for: ${task?.title}\n\nSummary Preview:\n${summaryHead}\n\nView the full report in the application.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`http://localhost:8000/analyze/tasks/${taskId}`, { method: 'DELETE' });
            if (res.ok) {
                navigate('/');
            }
        } catch (err) {
            console.error("Deletion failed:", err);
        }
    };

    const QuizView = ({ quizData }) => {
        const [userAnswers, setUserAnswers] = useState({});
        const [showResults, setShowResults] = useState(false);

        if (!quizData || !quizData.questions) return (
            <div className="flex flex-col items-center justify-center p-20 text-wood-500">
                <HelpCircle size={48} className="mb-4 opacity-20" />
                <p className="italic font-bold">Interactive quiz is being synthesized...</p>
            </div>
        );

        return (
            <div className="space-y-12">
                {quizData.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-black/20 p-8 rounded-[2rem] border border-white/5">
                        <h3 className="text-xl font-black text-white mb-6 flex items-start gap-4 leading-tight">
                            <span className="w-8 h-8 rounded-full bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-xs text-accent-gold shrink-0 mt-1">{qIdx + 1}</span>
                            {q.q || q.question}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, oIdx) => {
                                const isSelected = userAnswers[qIdx] === oIdx;
                                const isCorrect = q.answer === opt || q.correct_answer === oIdx;
                                let bgClass = "bg-white/5 border-white/5 text-wood-300";

                                if (showResults) {
                                    if (isCorrect) bgClass = "bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
                                    else if (isSelected) bgClass = "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30";
                                } else if (isSelected) {
                                    bgClass = "bg-accent-gold/10 border-accent-gold/40 text-accent-gold";
                                }

                                return (
                                    <button
                                        key={oIdx}
                                        disabled={showResults}
                                        onClick={() => setUserAnswers({ ...userAnswers, [qIdx]: oIdx })}
                                        className={`p-6 rounded-2xl border text-left text-sm font-bold transition-all ${bgClass} hover:bg-white/10`}
                                    >
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="uppercase text-[10px] opacity-40">Option {String.fromCharCode(65 + oIdx)}</span>
                                            {showResults && isCorrect && <Check size={14} className="text-emerald-500" />}
                                        </div>
                                        <div className="leading-snug">{opt}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {!showResults && (
                    <Button
                        variant="primary"
                        onClick={() => setShowResults(true)}
                        className="w-full h-20 bg-accent-gold text-wood-950 font-black py-4 rounded-3xl shadow-xl shadow-accent-gold/10 hover:bg-white"
                    >
                        SUBMIT QUIZ RESPONSE
                    </Button>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
            <div className="relative">
                <Spinner size="md" className="mb-4" />
                <div className="absolute inset-0 blur-xl bg-accent-gold/10 rounded-full animate-pulse" />
            </div>
            <p className="text-wood-500 text-[10px] font-black uppercase tracking-[0.4em]">Loading Intelligence Report...</p>
        </div>
    );

    if (error || !task) return (
        <div className="flex flex-col items-center justify-center py-40 text-center bg-white/[0.02] border border-white/5 rounded-[40px] border-dashed">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mb-6">
                <AlertCircle className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white italic mb-2 tracking-tight">Intelligence Unavailable</h2>
            <p className="text-wood-500 text-sm mb-8 font-bold">The requested analysis report could not be located in the neural vault.</p>
            <Button as={Link} to="/" icon={ChevronLeft} variant="glass">Back to Dashboard</Button>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 pb-20">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-4">
                    <Button as={Link} to="/" variant="ghost" size="sm" icon={ChevronLeft} className="bg-white/5 border border-white/5 text-wood-500 hover:text-accent-gold">
                        Dashboard
                    </Button>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Badge variant="gold" className="px-3 uppercase">{task.input_type || 'asset'}</Badge>
                        <span className="text-[10px] font-black text-wood-500 uppercase tracking-widest">{task.language} Context</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-wood-900/40 border border-white/5 rounded-2xl backdrop-blur-xl">
                    <Button
                        onClick={handleDownloadPDF}
                        size="sm"
                        variant="primary"
                        icon={downloading ? Spinner : Download}
                        disabled={downloading}
                        className="bg-accent-gold text-wood-950 font-black shadow-lg shadow-accent-gold/10 hover:bg-white"
                    >
                        {downloading ? 'Preparing...' : 'Download PDF'}
                    </Button>
                    <Button onClick={handleMail} size="sm" variant="secondary" icon={Mail} className="bg-white/5 border-white/5 text-wood-400 hover:text-white" />
                    <Button
                        onClick={() => setIsDeleteModalOpen(true)}
                        size="sm"
                        variant="secondary"
                        icon={Trash2}
                        className="bg-white/5 border-white/5 text-wood-500 hover:text-red-500 hover:bg-red-500/10"
                    />
                    <Button onClick={handleCopy} size="sm" variant="secondary" icon={copied ? Check : Copy} className="min-w-[44px] bg-white/5 border-white/5 text-wood-400">
                        {copied ? '' : ''}
                    </Button>
                </div>
            </div>

            {/* Header Content */}
            <div className="mb-14">
                <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="text-accent-gold animate-pulse" size={16} />
                    <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em]">Finalized Analysis</span>
                </div>
                <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-8">
                    {task.title || "Untitled Intelligence"}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-wood-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5"><Clock size={12} className="text-accent-gold" /> {new Date(task.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5"><BookOpen size={12} className="text-accent-gold" /> {task.language} Analysis</span>
                    <span className="flex items-center gap-2 text-emerald-400 italic bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.1)]"><CheckCircle2 size={12} /> Neural Verified</span>
                </div>
            </div>

            {/* Tabs Controller */}
            <div className="flex flex-wrap gap-2 mb-10 p-2 bg-wood-950/40 border border-white/5 rounded-3xl w-fit backdrop-blur-md">
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'summary' ? 'bg-accent-gold text-wood-950 shadow-xl shadow-accent-gold/10' : 'text-wood-500 hover:text-wood-200 hover:bg-white/5'}`}
                >
                    <Sparkles size={14} /> Intelligence Summary
                </button>
                <button
                    onClick={() => setActiveTab('transcript')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'transcript' ? 'bg-accent-gold text-wood-950 shadow-xl shadow-accent-gold/10' : 'text-wood-500 hover:text-wood-200 hover:bg-white/5'}`}
                >
                    <AlignLeft size={14} /> Full Transcript
                </button>
                {(artifacts?.quiz_json || task.input_type === 'youtube') && (
                    <button
                        onClick={() => setActiveTab('quiz')}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'quiz' ? 'bg-accent-gold text-wood-950 shadow-xl shadow-accent-gold/10' : 'text-wood-500 hover:text-wood-200 hover:bg-white/5'}`}
                    >
                        <HelpCircle size={14} /> Interactive Quiz
                    </button>
                )}
                {task?.slides?.length > 0 && (
                    <button
                        onClick={() => setActiveTab('visuals')}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'visuals' ? 'bg-accent-gold text-wood-950 shadow-xl shadow-accent-gold/10' : 'text-wood-500 hover:text-wood-200 hover:bg-white/5'}`}
                    >
                        <ImageIcon size={14} /> Visual Highlights
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
                {/* Information Sidebar */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
                    <Card padding="sm" className="bg-wood-900/40 border-white/5 glass-panel overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Brain size={40} className="text-accent-gold" />
                        </div>
                        <h3 className="text-[10px] font-black text-wood-600 uppercase tracking-widest mb-8 px-2 flex items-center gap-3">
                            <Hash size={12} className="text-accent-gold" /> Session Profile
                        </h3>
                        <div className="space-y-4 px-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-wood-700 uppercase tracking-widest">Neural Mode</span>
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                    <Badge variant="gold" className="text-[9px]">Optimized Llama-3</Badge>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 pt-4 border-t border-white/5">
                                <span className="text-[9px] font-black text-wood-700 uppercase tracking-widest">Entry Point</span>
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                    {task.input_type === 'youtube' ? <Youtube size={14} className="text-red-500" /> : <FileAudio size={14} className="text-accent-gold" />}
                                    {task.input_type || 'Asset'}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 pt-4 border-t border-white/5">
                                <span className="text-[9px] font-black text-wood-700 uppercase tracking-widest">Intelligence Link</span>
                                <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-2 italic">
                                    <CheckCircle2 size={12} /> Cryptographically Secure
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card padding="sm" className="bg-white/5 border-white/5">
                        <div className="flex flex-col gap-4">
                            <p className="text-[9px] text-wood-600 font-bold leading-relaxed px-1">
                                High-fidelity synthesis engine enabled. Cross-referenced with the latest {task.language} NLP benchmarks.
                            </p>
                            <Button onClick={handleCopy} variant="glass" className="w-full text-[9px] font-black tracking-widest uppercase py-4 rounded-xl border-white/5 group" icon={copied ? Check : Copy}>
                                <span className="group-hover:text-accent-gold transition-colors">{copied ? 'Copied' : `Copy ${activeTab}`}</span>
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <Card padding="none" className="bg-wood-900/60 border-white/5 overflow-hidden glass-panel shadow-2xl shadow-black/90">
                        {/* Scrollable Wrapper */}
                        <div className="max-h-[750px] min-h-[500px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                            <div className="p-8 md:p-12 lg:p-20">
                                <div className="prose prose-invert prose-amber max-w-none 
                                    prose-headings:text-white prose-headings:font-black prose-headings:tracking-tighter prose-headings:leading-tight
                                    prose-p:text-wood-200 prose-p:leading-relaxed prose-p:text-lg
                                    prose-li:text-wood-200 prose-li:text-lg prose-li:mb-2
                                    prose-strong:text-accent-gold prose-strong:font-black
                                    prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-[2rem] prose-pre:p-10 prose-pre:shadow-inner
                                    prose-table:border-white/10 prose-table:text-sm">

                                    <AnimatePresence mode="wait">
                                        {activeTab === 'summary' ? (
                                            <motion.div
                                                key="summary-view"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -15 }}
                                            >
                                                {artifacts?.report_markdown ? (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {artifacts.report_markdown}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <div className="bg-white/[0.03] border border-white/5 p-16 rounded-[3rem] text-center italic">
                                                        <Spinner size="md" className="mb-6 mx-auto opacity-40" />
                                                        <h3 className="text-white mb-2 font-black tracking-tight">Finalizing Intelligence...</h3>
                                                        <p className="text-wood-500 text-sm">Synchronizing neural datasets for {task.language} translation.</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : activeTab === 'transcript' ? (
                                            <motion.div
                                                key="transcript-view"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -15 }}
                                            >
                                                <div className="flex flex-wrap items-center gap-4 mb-8">
                                                    <button
                                                        onClick={() => setTranscriptMode('original')}
                                                        className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all shadow-xl ${transcriptMode === 'original' ? 'bg-accent-gold text-wood-950 shadow-accent-gold/20 scale-105' : 'bg-black/60 text-wood-400 hover:text-white border border-white/5 hover:bg-black'}`}
                                                    >
                                                        Original Audio 🇬🇧
                                                    </button>
                                                    <button
                                                        onClick={() => setTranscriptMode('translated')}
                                                        className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all shadow-xl ${transcriptMode === 'translated' ? 'bg-accent-gold text-wood-950 shadow-accent-gold/20 scale-105' : 'bg-black/60 text-wood-400 hover:text-white border border-white/5 hover:bg-black'}`}
                                                    >
                                                        Translated Notes 🚩 ({task?.language || 'Selected'})
                                                    </button>
                                                </div>
                                                <div className="whitespace-pre-wrap font-medium text-wood-300 leading-bold tracking-wide bg-black/40 p-12 md:p-20 rounded-[4rem] border border-white/5 italic text-[1.1rem] shadow-inner">
                                                    {transcriptMode === 'translated'
                                                        ? (artifacts?.report_json?.translated_transcript || "The translated transcript is currently unavailable for this session.")
                                                        : (artifacts?.raw_transcript || "The original transcript is currently unavailable.")
                                                    }
                                                </div>
                                            </motion.div>
                                        ) : activeTab === 'quiz' ? (
                                            <motion.div
                                                key="quiz-view"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                            >
                                                <div className="mb-14 border-b border-white/5 pb-8">
                                                    <h2 className="text-4xl font-black text-white italic tracking-tighter mb-3 leading-tight">Neural Knowledge Quiz</h2>
                                                    <p className="text-wood-500 text-sm font-bold max-w-lg leading-relaxed">
                                                        Test your comprehension based on the high-fidelity intelligence extracted from the media source.
                                                    </p>
                                                </div>
                                                <QuizView quizData={artifacts?.quiz_json} />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="visuals-view"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-10"
                                            >
                                                {task.slides?.map((slideUrl, idx) => (
                                                    <div key={idx} className="group relative bg-black/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-accent-gold/40 transition-all shadow-2xl">
                                                        <img
                                                            src={`http://localhost:8000${slideUrl}`}
                                                            alt={`Slide ${idx + 1}`}
                                                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-1000"
                                                        />
                                                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                                                                    Context Frame #{idx + 1}
                                                                </span>
                                                                <button className="p-4 bg-accent-gold rounded-2xl text-wood-950 shadow-2xl shadow-accent-gold/30 hover:bg-white transition-colors">
                                                                    <Maximize2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Footer Status */}
                        <div className="bg-accent-gold/[0.03] px-12 py-10 flex items-center justify-between border-t border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-accent-gold shadow-[0_0_20px_rgba(212,163,115,0.8)] animate-pulse" />
                                <span className="text-[10px] font-black text-wood-600 uppercase tracking-[0.4em]">Neural Summary Ledger • Source Hash: {task.id.slice(0, 8)}</span>
                            </div>
                            <Sparkles size={18} className="text-wood-800" />
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Purge Analysis Data?"
                message="This will permanently delete the intelligence report, metadata, and all visual highlights from our neural vault. This action is IRREVERSIBLE."
                confirmText="PURGE DATA"
                variant="danger"
            />
        </div>
    );
}
