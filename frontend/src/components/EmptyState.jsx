import { motion } from 'framer-motion';
import { FileSearch, Plus } from 'lucide-react';
import Button from './ui/Button';
import { useNavigate } from 'react-router-dom';

export default function EmptyState({ title, message, actionVisible = true }) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10"
            >
                <FileSearch size={40} className="text-indigo-400" />
            </motion.div>

            <h2 className="text-2xl font-black text-white mb-3 italic tracking-tight">{title}</h2>
            <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">
                {message}
            </p>

            {actionVisible && (
                <Button
                    variant="primary"
                    size="lg"
                    icon={Plus}
                    onClick={() => navigate('/new')}
                >
                    Begin First Session
                </Button>
            )}
        </div>
    );
}
