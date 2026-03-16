import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import {
    User, Mail, Shield, Bell, Key, Globe,
    Settings, Clock, CheckCircle2, AlertCircle,
    Save, Zap, Database, Lock, Terminal, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function Profile() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('integrations'); // Default to integrations per user request
    const [groqKey, setGroqKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch existing settings on mount
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

    // Statistics Protection
    user?.id ? `${import.meta.env.VITE_API_BASE_URL}/analyze/tasks?user_id=${user.id}` : null
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
                alert("Settings persisted to neural core.");
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
        { id: 'account', label: 'User Identity', icon: User },
        { id: 'preferences', label: 'System Tuning', icon: Settings },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            {/* Settings Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                        System <span className="text-accent-gold">Settings</span>
                    </h1>
                    <p className="text-wood-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                        Control Center / Configuration Node <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-pulse" />
                    </p>
                </div>

                <div className="flex bg-wood-950/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shrink-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-accent-gold text-wood-950 shadow-xl shadow-accent-gold/20' : 'text-wood-500 hover:text-wood-200 hover:bg-white/5'}`}
                            >
                                <Icon size={14} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Configuration Panels */}
            <AnimatePresence mode="wait">
                {activeTab === 'integrations' && (
                    <motion.div
                        key="integrations"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <Card className="p-10 bg-wood-900/40 border-white/5 relative overflow-hidden glass-panel">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none text-accent-gold">
                                <Terminal size={240} />
                            </div>

                            <div className="mb-10 max-w-2xl">
                                <h3 className="text-2xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-accent-gold rounded-full" />
                                    Groq Intelligence Handshake
                                </h3>
                                <p className="text-[10px] font-black text-wood-500 leading-relaxed uppercase tracking-wider">
                                    Connect your Groq Cloud node to enable high-fidelity neural analysis. Keys are validated in real-time against Groq infrastructure.
                                </p>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-wood-500 uppercase tracking-widest flex items-center gap-2 italic">
                                        <Lock size={12} className="text-accent-gold" /> Secure Groq API Key
                                    </label>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1 group">
                                            <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-wood-800 group-focus-within:text-accent-gold transition-colors" size={20} />
                                            <input
                                                type="password"
                                                placeholder="gsk_********************************"
                                                value={groqKey}
                                                onChange={(e) => setGroqKey(e.target.value)}
                                                className="w-full bg-wood-950/60 border-2 border-white/5 focus:border-accent-gold/40 rounded-2xl py-6 pl-14 pr-6 text-accent-gold font-mono text-sm tracking-widest placeholder:text-wood-900 focus:outline-none transition-all focus:ring-4 focus:ring-accent-gold/5"
                                            />
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs h-auto bg-accent-gold text-wood-950 shadow-2xl shadow-accent-gold/20"
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
                                            className={`p-6 rounded-3xl flex items-center justify-between border ${validationResult.success ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${validationResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                                    {validationResult.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Pipeline Status</div>
                                                    <div className="text-sm font-black italic tracking-tight">{validationResult.message}</div>
                                                </div>
                                            </div>
                                            {validationResult.success && (
                                                <Button
                                                    variant="ghost"
                                                    onClick={handleSaveSettings}
                                                    loading={isSaving}
                                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                                >
                                                    Persist Key
                                                </Button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5 mt-10">
                                    <IntegrationFeature icon={Zap} title="Extreme Ingest" desc="Llama 3.3 Powered" />
                                    <IntegrationFeature icon={Globe} title="Neural Sync" desc="Multi-Lingual" />
                                    <IntegrationFeature icon={Shield} title="Vault Protection" desc="Hardware AES" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 bg-wood-900/40 border-white/5 border-dashed border-2 flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-wood-950 border border-white/5 flex items-center justify-center text-wood-700 shadow-inner group-hover:text-accent-gold transition-colors">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-wood-600 uppercase tracking-widest mb-1 italic">Auxiliary Intelligence</h4>
                                    <p className="text-[9px] font-bold text-wood-800 uppercase leading-relaxed">Multi-Agent orchestration with OpenAI and Anthropic coming in next release phase.</p>
                                </div>
                            </div>
                            <Badge variant="wood" className="py-2 px-6">BETA ACCESS</Badge>
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
                        <Card className="p-12 bg-wood-900/40 border-white/5 flex flex-col items-center text-center glass-panel">
                            <div className="relative mb-8 group">
                                <div className="w-36 h-36 rounded-[2.5rem] bg-accent-gold flex items-center justify-center text-wood-950 shadow-2xl relative z-10">
                                    <User size={56} />
                                </div>
                                <div className="absolute -inset-4 bg-accent-gold/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-4xl font-black text-white tracking-tighter italic mb-2">{user?.name || "System Architect"}</h3>
                            <p className="text-sm font-black text-wood-500 uppercase tracking-widest">{user?.email || "admin@videoneural.ai"}</p>
                            <div className="mt-12 flex gap-4 w-full max-w-md">
                                <Button variant="secondary" size="lg" className="flex-1 py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] border-white/5">Modify Vault</Button>
                                <Button variant="secondary" size="lg" className="flex-1 py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] text-red-500 border-red-500/10 hover:bg-red-500/5">Terminate</Button>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <MetricBox label="Inference Tokens" value={completedCount * 1280} icon={Activity} />
                            <MetricBox label="Optimization" value="99.9%" icon={CheckCircle2} />
                        </div>
                    </motion.div>
                )}

                {activeTab === 'preferences' && (
                    <motion.div
                        key="preferences"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        <Card className="p-10 bg-wood-900/40 border-white/5 glass-panel">
                            <div className="mb-12">
                                <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">Neural Tuner</h3>
                                <p className="text-[10px] font-black text-wood-600 uppercase tracking-widest">Adjust global processing parameters</p>
                            </div>
                            <div className="space-y-4">
                                <TuneRow title="Neural Telemetry" active={true} desc="Real-time performance broadcasting" />
                                <TuneRow title="Auto-Summarization" active={false} desc="Passive content distillation" />
                                <TuneRow title="Multi-Lingual Bridge" active={true} desc="Cross-translation engine" />
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function IntegrationFeature({ icon: Icon, title, desc }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-wood-600 group-hover:text-accent-gold transition-colors border border-white/5">
                <Icon size={20} />
            </div>
            <div>
                <div className="text-[10px] font-black text-white uppercase tracking-tight">{title}</div>
                <div className="text-[9px] font-bold text-wood-700 uppercase tracking-widest">{desc}</div>
            </div>
        </div>
    );
}

function MetricBox({ label, value, icon: Icon }) {
    return (
        <Card className="p-8 bg-wood-950/40 border-white/5 flex items-center justify-between group glass-panel">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-wood-700 group-hover:text-accent-gold transition-colors">
                    <Icon size={24} />
                </div>
                <span className="text-[10px] font-black text-wood-500 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-3xl font-black italic text-white tracking-tighter shadow-sm">{value}</span>
        </Card>
    );
}

function TuneRow({ title, active, desc }) {
    return (
        <div className="p-8 rounded-[2rem] bg-black/20 border border-white/5 flex items-center justify-between hover:bg-black/30 transition-colors">
            <div>
                <div className="text-xs font-black text-white uppercase tracking-tight mb-1">{title}</div>
                <div className="text-[10px] font-bold text-wood-700 uppercase italic tracking-wide">{desc}</div>
            </div>
            <div className={`w-14 h-7 rounded-full relative transition-all cursor-pointer ${active ? 'bg-accent-gold shadow-lg shadow-accent-gold/20' : 'bg-wood-950'}`}>
                <div className={`absolute top-1 w-5 h-5 rounded-full shadow-md transition-all ${active ? 'left-8 bg-wood-950' : 'left-1 bg-wood-800'}`} />
            </div>
        </div>
    );
}
