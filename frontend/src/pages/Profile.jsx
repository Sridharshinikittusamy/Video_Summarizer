import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import {
    User, Settings, Zap, Key, Shield, Globe, Terminal, Activity,
    CheckCircle2, AlertCircle, Lock, Moon, Sun, Monitor, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function Profile() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('integrations');
    const [groqKey, setGroqKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user?.id) return;
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/settings?user_id=${user.id}`);
                const data = await response.json();
                if (data?.groq_api_key) {
                    setGroqKey(data.groq_api_key);
                }
            } catch (err) {
                console.error("Failed to fetch user settings:", err);
            }
        };
        fetchSettings();
    }, [user?.id]);

    const { data: tasks } = useApi(user?.id ? `${import.meta.env.VITE_API_BASE_URL}/analyze/tasks?user_id=${user.id}` : null);
    const completedCount = tasks?.length || 0;

    const handleValidateKey = async () => {
        if (!groqKey.trim()) return;
        setIsValidating(true);
        setValidationResult(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/validate-groq`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ api_key: groqKey })
            });
            const data = await response.json();
            if (response.ok) {
                setValidationResult({ success: true, message: data.message });
            } else {
                setValidationResult({ success: false, message: data.detail || "Handshake Aborted" });
            }
        } catch (err) {
            setValidationResult({ success: false, message: "Network synchronization failure." });
        } finally {
            setIsValidating(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/analyze/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    user_id: user.id,
                    groq_api_key: groqKey
                })
            });
            if (response.ok) {
                alert("Settings persisted.");
            } else {
                alert("Failed to save settings.");
            }
        } catch (err) {
            alert("Network error: Could not save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'integrations', label: 'AI Integrations', icon: Zap },
        { id: 'preferences', label: 'System Tuning', icon: Settings },
        { id: 'account', label: 'User Identity', icon: User },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-surface-900 dark:text-white tracking-tight leading-none">
                        System <span className="text-brand-500 dark:text-brand-500">Settings</span>
                    </h1>
                    <p className="text-surface-500 dark:text-wood-500 text-sm md:text-[10px] font-medium md:font-black md:uppercase tracking-wide md:tracking-[0.4em] mt-3 flex items-center gap-2">
                        Control Center / Configuration Node <span className="w-1.5 h-1.5 bg-brand-500 dark:bg-brand-500 rounded-full animate-pulse" />
                    </p>
                </div>

                <div className="flex bg-surface-100 dark:bg-wood-950/40 p-1.5 rounded-xl border border-surface-200 dark:border-white/5 backdrop-blur-xl shrink-0 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-[10px] font-semibold md:font-black md:uppercase md:tracking-widest transition-all whitespace-nowrap ${isActive ? 'bg-brand-100 dark:bg-brand-500 text-brand-700 dark:text-wood-950 shadow-sm dark:shadow-xl dark:shadow-brand-500/20' : 'text-surface-500 dark:text-wood-500 hover:text-surface-900 dark:hover:text-wood-200 hover:bg-white/10 dark:hover:bg-white/5'}`}
                                style={{ borderColor: '#D4A373' }}
                            >
                                <Icon size={14} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'integrations' && (
                    <motion.div
                        key="integrations"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <Card
                            style={{ borderColor: '#D4A373' }}
                            className="p-8 md:p-10 bg-white dark:bg-wood-900/40 border-2 shadow-sm dark:shadow-none relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] dark:opacity-[0.03] pointer-events-none text-brand-500 dark:text-brand-500">
                                <Terminal size={240} />
                            </div>

                            <div className="mb-10 max-w-2xl relative z-10">
                                <h3 className="text-xl md:text-2xl font-bold dark:font-black text-surface-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
                                    <div
                                        style={{ backgroundColor: '#D4A373' }}
                                        className="w-1.5 md:w-2 h-6 md:h-8 rounded-full"
                                    />
                                    Groq Intelligence Handshake
                                </h3>
                                <p className="text-sm md:text-[10px] font-medium md:font-black text-surface-500 dark:text-wood-500 leading-relaxed md:uppercase md:tracking-wider">
                                    Connect your Groq Cloud node to enable high-fidelity neural analysis. Keys are validated in real-time against Groq infrastructure.
                                </p>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-xs md:text-[10px] font-semibold md:font-black text-surface-500 dark:text-wood-500 md:uppercase md:tracking-widest flex items-center gap-2 italic">
                                        <Lock size={12} style={{ color: '#D4A373' }} /> Secure Groq API Key
                                    </label>
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        <div className="relative flex-1 group">
                                            <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-wood-800 group-focus-within:text-brand-500 dark:group-focus-within:text-brand-500 transition-colors" size={20} style={{ color: '#D4A373' }} />
                                            <input
                                                type="password"
                                                placeholder="gsk_********************************"
                                                value={groqKey}
                                                onChange={(e) => setGroqKey(e.target.value)}
                                                className="w-full bg-surface-50 dark:bg-wood-950/60 border-2 border-surface-200 dark:border-white/5 focus:border-brand-400 dark:focus:border-brand-500/40 rounded-xl py-4 md:py-6 pl-14 pr-6 text-surface-900 dark:text-brand-500 font-mono text-sm tracking-widest placeholder:text-surface-400 dark:placeholder:text-wood-900 focus:outline-none transition-all focus:ring-4 focus:ring-brand-50 dark:focus:ring-brand-500/5"
                                            />
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="px-8 md:px-12 py-4 md:py-5 rounded-xl font-bold md:font-black md:uppercase md:tracking-widest text-sm md:text-xs h-auto shadow-md dark:shadow-2xl dark:shadow-brand-500/20"
                                            style={{ backgroundColor: '#D4A373' }}
                                            onClick={handleValidateKey}
                                            loading={isValidating}
                                            disabled={!groqKey.trim()}
                                        >
                                            Validate Node
                                        </Button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {validationResult && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`p-6 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border ${validationResult.success ? 'bg-green-50 dark:bg-emerald-500/5 border-green-200 dark:border-emerald-500/20 text-green-800 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-500'}`}
                                        >
                                            <div className="flex items-center gap-4 md:gap-5">
                                                <div className={`shrink-0 w-12 h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${validationResult.success ? 'bg-green-100 dark:bg-emerald-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
                                                    {validationResult.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                                </div>
                                                <div>
                                                    <div className="text-xs md:text-[10px] font-semibold md:font-black md:uppercase md:tracking-[0.2em] mb-1">Pipeline Status</div>
                                                    <div className="text-sm font-bold italic tracking-tight">{validationResult.message}</div>
                                                </div>
                                            </div>
                                            {validationResult.success && (
                                                <Button
                                                    variant={theme === 'dark' ? 'ghost' : 'secondary'}
                                                    onClick={handleSaveSettings}
                                                    loading={isSaving}
                                                    className="w-full md:w-auto bg-green-100 hover:bg-green-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-green-700 dark:text-emerald-400 border-green-200 dark:border-emerald-500/20 px-8 rounded-xl font-bold md:font-black text-sm md:text-[10px] md:uppercase md:tracking-widest"
                                                >
                                                    Persist Key
                                                </Button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-surface-100 dark:border-white/5 mt-10">
                                    <IntegrationFeature icon={Zap} title="Extreme Ingest" desc="Llama 3.3 Powered" />
                                    <IntegrationFeature icon={Globe} title="Neural Sync" desc="Multi-Lingual" />
                                    <IntegrationFeature icon={Shield} title="Vault Protection" desc="Hardware AES" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'preferences' && (
                    <motion.div
                        key="preferences"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        <Card
                            style={{ borderColor: '#D4A373' }}
                            className="p-8 md:p-10 bg-white border-2 rounded-xl shadow-sm transition-all duration-200 dark:bg-wood-900/40 dark:border-white/5 dark:shadow-none dark:glass-panel"
                        >
                            <div className="mb-10">
                                <h3 className="text-2xl font-bold dark:font-black text-surface-900 dark:text-white dark:italic tracking-tight mb-2">Display Mode</h3>
                                <p className="text-sm md:text-[10px] font-medium md:font-black text-surface-500 dark:text-wood-600 md:uppercase md:tracking-widest">Select your visual interface environment</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-surface-100 dark:border-white/5 pb-10 mb-10">
                                <button onClick={() => setTheme('light')}
                                    style={{ borderColor: '#D4A373' }}
                                    className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${theme === 'light' ? 'bg-brand-50/50 dark:bg-transparent shadow-sm shadow-brand-500/10' : 'bg-white dark:bg-wood-950 dark:border-white/5'}`}
                                >
                                    <div className={`p-3 rounded-full ${theme === 'light' ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-500' : 'bg-surface-100 text-surface-500 dark:bg-white/5 dark:text-wood-500'}`}>
                                        <Sun size={24} />
                                    </div>
                                    <span className="text-sm font-semibold text-surface-900 dark:text-white">Calm Light</span>
                                </button>

                                <button onClick={() => setTheme('dark')}
                                    style={{ borderColor: '#D4A373' }}
                                    className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${theme === 'dark' ? 'bg-brand-50/50 dark:bg-transparent shadow-sm shadow-brand-500/10' : 'bg-white dark:bg-wood-950 dark:border-white/5'}`}
                                >
                                    <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-500' : 'bg-surface-100 text-surface-500 dark:bg-white/5 dark:text-wood-500'}`}>
                                        <Moon size={24} />
                                    </div>
                                    <span className="text-sm font-semibold text-surface-900 dark:text-white">Industrial Dark</span>
                                </button>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold dark:font-black text-surface-900 dark:text-white dark:italic tracking-tight mb-2">Neural Tuner</h3>
                                <p className="text-sm md:text-[10px] font-medium md:font-black text-surface-500 dark:text-wood-600 md:uppercase md:tracking-widest">Adjust global processing parameters</p>
                            </div>
                            <div className="space-y-4">
                                <TuneRow title="Neural Telemetry" active={true} desc="Real-time performance broadcasting" />
                                <TuneRow title="Auto-Summarization" active={false} desc="Passive content distillation" />
                                <TuneRow title="Multi-Lingual Bridge" active={true} desc="Cross-translation engine" />
                            </div>
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'account' && (
                    <motion.div
                        key="account"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        <Card
                            style={{ borderColor: '#D4A373' }}
                            className="p-8 md:p-12 bg-white dark:bg-wood-900/40 border-2 shadow-sm dark:shadow-none flex flex-col items-center text-center dark:glass-panel"
                        >
                            <div className="relative mb-8 group">
                                <div
                                    style={{ backgroundColor: '#D4A373' }}
                                    className="w-24 h-24 md:w-36 md:h-36 rounded-full md:rounded-[2.5rem] flex items-center justify-center text-white shadow-sm dark:shadow-2xl relative z-10"
                                >
                                    <User size={48} className="md:w-[56px] md:h-[56px]" />
                                </div>
                                <div className="absolute -inset-4 bg-brand-400/20 dark:bg-brand-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold md:font-black text-surface-900 dark:text-white dark:tracking-tighter dark:italic mb-2">{user?.name || "System Architect"}</h3>
                            <p className="text-sm font-medium md:font-black text-surface-500 dark:text-wood-500 md:uppercase md:tracking-widest">{user?.email || "admin@videoneural.ai"}</p>
                            <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-md">
                                <Button variant="secondary" size="lg" className="flex-1 py-4 md:py-5 rounded-xl md:rounded-3xl font-semibold md:font-black md:uppercase text-sm md:text-[10px] md:tracking-[0.2em] dark:border-white/5" icon={Shield} iconStyle={{ color: '#D4A373' }}>Modify Vault</Button>
                                <Button variant="secondary" size="lg" className="flex-1 py-4 md:py-5 rounded-xl md:rounded-3xl font-semibold md:font-black md:uppercase text-sm md:text-[10px] md:tracking-[0.2em] text-red-600 dark:text-red-500 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-transparent dark:border-red-500/10 dark:hover:bg-red-500/5" icon={Trash2}>Terminate</Button>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <MetricBox label="Inference Tokens" value={completedCount * 1280} icon={Activity} />
                            <MetricBox label="Optimization" value="99.9%" icon={CheckCircle2} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function IntegrationFeature({ icon: Icon, title, desc }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl md:rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center transition-colors border border-brand-100 dark:border-brand-500/20">
                <Icon size={20} style={{ color: '#D4A373' }} />
            </div>
            <div>
                <div className="text-xs md:text-[10px] font-semibold md:font-black text-surface-900 dark:text-white md:uppercase tracking-tight">{title}</div>
                <div className="text-[10px] md:text-[9px] font-medium md:font-bold text-surface-500 dark:text-wood-700 md:uppercase md:tracking-widest">{desc}</div>
            </div>
        </div>
    );
}

function MetricBox({ label, value, icon: Icon }) {
    return (
        <Card
            style={{ borderColor: '#D4A373' }}
            className="p-6 md:p-8 bg-white dark:bg-wood-950/40 border-2 shadow-sm dark:shadow-none flex items-center justify-between group dark:glass-panel"
        >
            <div className="flex items-center gap-4 md:gap-5">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center transition-colors">
                    <Icon size={20} className="md:w-6 md:h-6" style={{ color: '#D4A373' }} />
                </div>
                <span className="text-xs md:text-[10px] font-medium md:font-black text-surface-500 dark:text-wood-500 md:uppercase md:tracking-widest">{label}</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold md:font-black dark:italic text-surface-900 dark:text-white tracking-tighter dark:shadow-sm">{value}</span>
        </Card>
    );
}

function TuneRow({ title, active, desc }) {
    return (
        <div
            style={{ borderColor: '#D4A373' }}
            className="p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-brand-50/30 dark:bg-black/20 border-2 flex items-center justify-between hover:bg-brand-50/50 dark:hover:bg-black/30 transition-colors"
        >
            <div>
                <div className="text-sm md:text-xs font-semibold md:font-black text-surface-900 dark:text-white md:uppercase tracking-tight mb-1">{title}</div>
                <div className="text-xs md:text-[10px] font-medium md:font-bold text-surface-500 dark:text-wood-700 md:uppercase dark:italic tracking-wide">{desc}</div>
            </div>
            <div className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative transition-all cursor-pointer ${active ? 'bg-brand-500 shadow-md dark:shadow-lg dark:shadow-brand-500/20' : 'bg-surface-300 dark:bg-wood-950'}`} style={active ? { backgroundColor: '#D4A373' } : {}}>
                <div className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-white transition-all ${active ? 'left-7 md:left-8 dark:bg-wood-950 shadow-sm' : 'left-1 dark:bg-wood-800 shadow-sm'}`} />
            </div>
        </div>
    );
}
