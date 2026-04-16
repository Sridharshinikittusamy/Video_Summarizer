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
                    className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="relative w-full max-w-md bg-white border border-surface-200 rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-5">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-sage-50 text-sage-600'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <h3 className="text-xl font-semibold text-surface-900 mb-2">
                            {title}
                        </h3>
                        <p className="text-surface-500 text-sm leading-relaxed mb-8">
                            {message}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={onClose}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                variant={variant === 'danger' ? 'danger' : 'primary'}
                                className="flex-1"
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
