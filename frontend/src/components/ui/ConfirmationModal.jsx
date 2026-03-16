import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmLabel = "Delete",
    variant = "danger"
}) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-wood-950 border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden glass-panel"
                >
                    <div className="p-8 md:p-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/10 text-red-500 shadow-lg shadow-red-500/10' : 'bg-accent-gold/10 text-accent-gold shadow-lg shadow-accent-gold/10'}`}>
                                <AlertTriangle size={28} />
                            </div>
                            <button onClick={onClose} className="p-2 text-wood-600 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <h3 className="text-2xl font-black text-white tracking-tighter mb-2">
                            {title}
                        </h3>
                        <p className="text-wood-400 text-sm font-medium leading-relaxed mb-10">
                            {message}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest border-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                variant={variant === 'danger' ? 'primary' : 'primary'}
                                className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest shadow-2xl ${variant === 'danger' ? 'bg-red-600 hover:bg-white text-white hover:text-red-600 shadow-red-600/20 border-red-500/20' : 'bg-accent-gold hover:bg-white text-wood-950 shadow-accent-gold/20 border-accent-gold/20'}`}
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
