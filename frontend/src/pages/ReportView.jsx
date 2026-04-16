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
    const [activeTab, setActiveTab] = useState('summary');
    const [transcriptMode, setTranscriptMode] = useState('original');
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [shareStatus, setShareStatus] = useState(null);

    const { data: task, loading: loadingTask, error: taskError } = useApi(`${import.meta.env.VITE_API_BASE_URL}/analyze/tasks/${taskId}`);
    const { data: artifacts, loading: loadingArtifacts } = useApi(`${import.meta.env.VITE_API_BASE_URL}/analyze/tasks/${taskId}/artifacts`);

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
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${artifacts.pdf_url}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${task.title || 'Analysis_Report'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            window.open(`${import.meta.env.VITE_API_BASE_URL}${artifacts.pdf_url}`, '_blank');
        } finally {
            setDownloading(false);
        }
    };

    const handleMail = () => {
        setIsEmailModalOpen(true);
        setEmailError('');
    };

    const handleShareEmail = async (e) => {
        e.preventDefault();
        if (!emailInput || !emailInput.includes('@')) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        setIsSharing(true);
        setEmailError('');

        try {
            const formData = new FormData();
            formData.append('email', emailInput);

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/tasks/${taskId}/share-email`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setShareStatus('success');
                setTimeout(() => {
                    setIsEmailModalOpen(false);
                    setEmailInput('');
                    setShareStatus(null);
                }, 3000);
            } else {
                const errData = await res.json();
                setEmailError(errData.detail || 'Failed to transmit intelligence.');
                setShareStatus('error');
            }
        } catch (err) {
            setEmailError('Network interruption. Please try again.');
            setShareStatus('error');
        } finally {
            setIsSharing(false);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/tasks/${taskId}`, { method: 'DELETE' });
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
            <div className="flex flex-col items-center justify-center p-20 text-surface-400">
                <HelpCircle size={48} className="mb-4 opacity-50" />
                <p className="font-medium text-sm">Interactive quiz is unavailable or still generating...</p>
            </div>
        );

        return (
            <div className="space-y-8">
                {quizData.questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-6 flex items-start gap-4 leading-snug">
                            <span className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/20 flex items-center justify-center text-sm text-brand-600 dark:text-brand-500 shrink-0 mt-0.5">{qIdx + 1}</span>
                            {q.q || q.question}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, oIdx) => {
                                const isSelected = userAnswers[qIdx] === oIdx;
                                const isCorrect = q.answer === opt || q.correct_answer === oIdx;
                                let bgClass = "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100";

                                if (showResults) {
                                    if (isCorrect) bgClass = "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-800 dark:text-green-400";
                                    else if (isSelected) bgClass = "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-400";
                                } else if (isSelected) {
                                    bgClass = "bg-brand-50 dark:bg-brand-500/10 border-brand-300 dark:border-brand-500/40 text-brand-800 dark:text-brand-400";
                                }

                                return (
                                    <button
                                        key={oIdx}
                                        disabled={showResults}
                                        onClick={() => setUserAnswers({ ...userAnswers, [qIdx]: oIdx })}
                                        className={`p-4 rounded-xl border text-left text-sm font-medium transition-all dark:bg-wood-950/40 dark:border-white/5 ${bgClass}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="uppercase text-xs font-semibold opacity-60">Option {String.fromCharCode(65 + oIdx)}</span>
                                            {showResults && isCorrect && <Check size={16} className="text-green-600" />}
                                        </div>
                                        <div className="leading-relaxed">{opt}</div>
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
                        className="w-full py-4 text-base shadow-sm"
                    >
                        Submit Quiz Responses
                    </Button>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-surface-500 text-sm font-semibold tracking-wide">Loading Report...</p>
        </div>
    );

    if (error || !task) return (
        <div className="flex flex-col items-center justify-center py-32 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-semibold text-surface-900 mb-2">Report Not Found</h2>
            <p className="text-surface-500 text-sm mb-8 leading-relaxed">The requested analysis report could not be located. It may have been deleted or the process failed.</p>
            <Button as={Link} to="/" icon={ChevronLeft} variant="secondary">Back to Dashboard</Button>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
            {/* Header Area */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <Button as={Link} to="/" variant="ghost" size="sm" icon={ChevronLeft} className="-ml-2 mb-6 text-surface-500">
                        Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-2 mb-3">
                        <Badge variant="default" className="uppercase text-[10px]">{task.input_type || 'asset'}</Badge>
                        <span className="text-xs font-semibold text-brand-600 dark:text-brand-500 px-2 py-0.5 bg-brand-50 dark:bg-brand-500/10 rounded-full">{task.language} Analysis</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-semibold text-surface-900 dark:text-white tracking-tight leading-tight">
                        {task.title || "Untitled Intelligence"}
                    </h1>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        onClick={() => setIsPdfModalOpen(true)}
                        size="sm" variant="secondary" icon={FileText} disabled={!artifacts?.pdf_url}
                    >
                        View PDF
                    </Button>
                    <Button
                        onClick={handleDownloadPDF}
                        size="sm" variant="secondary" icon={downloading ? Spinner : Download} disabled={downloading || !artifacts?.pdf_url}
                    >
                        {downloading ? 'Downloading...' : 'Download PDF'}
                    </Button>
                    <Button onClick={handleMail} size="sm" variant="secondary" className="px-3" icon={Mail} />
                    <Button onClick={() => setIsDeleteModalOpen(true)} size="sm" variant="ghost" className="px-3 text-surface-400 hover:text-red-600" icon={Trash2} />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 mb-8 p-1.5 bg-brand-50/50 dark:bg-wood-950/60 rounded-2xl w-fit border-2 border-brand-50 dark:border-brand-500/10 shadow-sm">
                <button
                    onClick={() => setActiveTab('summary')}
                    style={activeTab === 'summary' ? { backgroundColor: '#D4A373' } : {}}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'summary' ? 'text-white shadow-lg shadow-brand-500/20' : 'text-brand-500/60 dark:text-wood-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/40'}`}
                >
                    <FileText size={16} /> Summary
                </button>
                <button
                    onClick={() => setActiveTab('transcript')}
                    style={activeTab === 'transcript' ? { backgroundColor: '#D4A373' } : {}}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'transcript' ? 'text-white shadow-lg shadow-brand-500/20' : 'text-brand-500/60 dark:text-wood-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/40'}`}
                >
                    <AlignLeft size={16} /> Transcript
                </button>
                {(artifacts?.quiz_json || task.input_type === 'youtube') && (
                    <button
                        onClick={() => setActiveTab('quiz')}
                        style={activeTab === 'quiz' ? { backgroundColor: '#D4A373' } : {}}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'quiz' ? 'text-white shadow-lg shadow-brand-500/20' : 'text-brand-500/60 dark:text-wood-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/40'}`}
                    >
                        <HelpCircle size={16} /> Quiz
                    </button>
                )}
                {task?.slides?.length > 0 && (
                    <button
                        onClick={() => setActiveTab('visuals')}
                        style={activeTab === 'visuals' ? { backgroundColor: '#D4A373' } : {}}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'visuals' ? 'text-white shadow-lg shadow-brand-500/20' : 'text-brand-500/60 dark:text-wood-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/40'}`}
                    >
                        <ImageIcon size={16} /> VisualHighlights
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <Card padding="none" className="overflow-hidden">
                        <div className="p-8 md:p-12 min-h-[600px]">
                            <AnimatePresence mode="wait">
                                {activeTab === 'summary' ? (
                                    <motion.div key="summary-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                        <div className="flex justify-end mb-4">
                                            <Button onClick={handleCopy} size="sm" variant="ghost" className="text-surface-500" icon={copied ? Check : Copy}>
                                                {copied ? 'Copied' : 'Copy Text'}
                                            </Button>
                                        </div>
                                        <div className="prose prose-brand dark:prose-invert max-w-none 
                                            prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-surface-900 dark:prose-headings:text-white
                                            prose-p:text-surface-700 dark:prose-p:text-wood-300 prose-p:leading-relaxed
                                            prose-li:text-surface-700 dark:prose-li:text-wood-300
                                            prose-strong:text-surface-900 dark:prose-strong:text-white prose-strong:font-semibold
                                            prose-pre:bg-surface-50 dark:prose-pre:bg-black/40 prose-pre:border prose-pre:border-surface-200 dark:prose-pre:border-white/5 prose-pre:rounded-xl">
                                            {artifacts?.report_markdown ? (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {artifacts.report_markdown}
                                                </ReactMarkdown>
                                            ) : (
                                                <div className="text-center py-20">
                                                    <Spinner size="md" className="mx-auto mb-4" />
                                                    <p className="text-surface-500 text-sm font-medium">Finalizing analysis logic...</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : activeTab === 'transcript' ? (
                                    <motion.div key="transcript-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center p-1.5 bg-brand-50/50 dark:bg-wood-950/40 border border-brand-100/60 dark:border-brand-500/10 rounded-xl mb-6">
                                                <button
                                                    onClick={() => setTranscriptMode('original')}
                                                    style={transcriptMode === 'original' ? { backgroundColor: '#D4A373' } : {}}
                                                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${transcriptMode === 'original' ? 'text-white shadow-md shadow-brand-500/20' : 'text-brand-500/60 dark:text-wood-500 hover:text-brand-600 dark:hover:text-brand-400'}`}
                                                >
                                                    Original Context
                                                </button>
                                                <button
                                                    onClick={() => setTranscriptMode('english')}
                                                    style={transcriptMode === 'english' ? { backgroundColor: '#D4A373' } : {}}
                                                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${transcriptMode === 'english' ? 'text-white shadow-md shadow-brand-500/20' : 'text-brand-500/60 dark:text-wood-500 hover:text-brand-600 dark:hover:text-brand-400'}`}
                                                >
                                                    English Context
                                                </button>
                                            </div>
                                            <Button onClick={handleCopy} size="sm" variant="ghost" className="text-surface-500" icon={copied ? Check : Copy}>
                                                {copied ? 'Copied' : 'Copy Transcript'}
                                            </Button>
                                        </div>
                                        <div className="whitespace-pre-wrap font-medium text-surface-700 dark:text-wood-300 leading-relaxed bg-surface-50 dark:bg-black/20 p-8 rounded-2xl border border-surface-200 dark:border-white/5 text-sm">
                                            {transcriptMode === 'english'
                                                ? (artifacts?.report_json?.english_transcript || artifacts?.raw_transcript || "The English transcript is currently unavailable.")
                                                : (artifacts?.raw_transcript || "The original transcript is currently unavailable.")
                                            }
                                        </div>
                                    </motion.div>
                                ) : activeTab === 'quiz' ? (
                                    <motion.div key="quiz-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                                        <div className="mb-10 pb-6 border-b border-surface-100 dark:border-white/5">
                                            <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-2">Comprehension Quiz</h2>
                                            <p className="text-surface-500 text-sm leading-relaxed">
                                                Test your understanding based on the findings of this report.
                                            </p>
                                        </div>
                                        <QuizView quizData={artifacts?.quiz_json} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="visuals-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {task.slides?.map((slideUrl, idx) => (
                                            <div key={idx} className="group relative bg-surface-50 border border-surface-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                                                <img
                                                    src={`${import.meta.env.VITE_API_BASE_URL}${slideUrl}`}
                                                    alt={`Slide ${idx + 1}`}
                                                    className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                                />
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>
                </div>

                {/* Info Sidebar */}
                <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-8">
                    <Card padding="md" className="bg-white dark:bg-wood-950/40 border-2 border-brand-50 dark:border-brand-500/10 shadow-sm">
                        <h3 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Brain size={14} /> Metadata Insight
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <span className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Source Logic</span>
                                <div className="text-sm font-semibold text-surface-900 flex items-center gap-2">
                                    <Badge variant="default" className="text-[10px]">v2 Pipeline</Badge>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-surface-200 dark:border-white/5">
                                <span className="block text-xs font-semibold text-surface-400 dark:text-wood-600 uppercase tracking-wider mb-1">Created on</span>
                                <div className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                                    <Clock size={14} className="text-surface-500 dark:text-wood-400" /> {new Date(task.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="pt-4 border-t border-surface-200 dark:border-white/5">
                                <span className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">System Status</span>
                                <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} /> Integrity Verified
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Analysis"
                message="This will permanently delete this intelligence report and all associated data."
                confirmLabel="Delete Data"
                variant="danger"
            />

            <AnimatePresence>
                {isEmailModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEmailModalOpen(false)} className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative bg-white rounded-2xl w-full max-w-md shadow-xl border border-surface-200 p-8 z-10">
                            <div className="w-12 h-12 bg-sage-50 text-sage-600 rounded-xl flex items-center justify-center mb-6">
                                <Send size={24} />
                            </div>
                            <h2 className="text-xl font-semibold text-surface-900 mb-2">Share via Email</h2>
                            <p className="text-surface-500 text-sm mb-6">Send a copy of this analysis report directly to an inbox.</p>

                            {shareStatus === 'success' ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                                    <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={20} />
                                    <p className="text-sm font-medium text-emerald-800">Email sent successfully.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleShareEmail} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-surface-600 mb-1.5">Email Address</label>
                                        <input
                                            type="email" required
                                            value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                                            placeholder="colleague@company.com"
                                            className="w-full bg-white border border-surface-300 rounded-lg px-4 py-2.5 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-sm transition-shadow"
                                        />
                                        {emailError && <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1"><AlertCircle size={12} /> {emailError}</p>}
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Button type="button" variant="secondary" onClick={() => setIsEmailModalOpen(false)} className="flex-1">Cancel</Button>
                                        <Button type="submit" variant="primary" disabled={isSharing} className="flex-1" icon={isSharing ? Spinner : Send}>
                                            {isSharing ? 'Sending...' : 'Send'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isPdfModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPdfModalOpen(false)} className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative bg-white dark:bg-wood-950 rounded-2xl w-full max-w-6xl h-full flex flex-col shadow-2xl overflow-hidden z-10 border border-surface-200 dark:border-white/10">
                            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-white/10 bg-surface-50 dark:bg-wood-900/40">
                                <h3 className="text-surface-900 dark:text-white font-semibold flex items-center gap-2">
                                    <FileText size={18} className="text-brand-500" />
                                    PDF Preview
                                </h3>
                                <button
                                    onClick={() => setIsPdfModalOpen(false)}
                                    className="p-1.5 text-surface-400 hover:bg-surface-200 hover:text-surface-900 rounded-lg transition-colors"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            <div className="flex-1 bg-surface-100">
                                {artifacts?.pdf_url ? (
                                    <iframe src={`${import.meta.env.VITE_API_BASE_URL}${artifacts.pdf_url}#toolbar=0`} className="w-full h-full border-none" title="PDF Viewer" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-surface-500 font-medium text-sm">PDF not generated yet.</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
