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
                className="w-20 h-20 bg-surface-100 rounded-3xl flex items-center justify-center mb-6 border border-surface-200"
            >
                <FileSearch size={32} className="text-surface-400" />
            </motion.div>

            <h2 className="text-xl font-semibold text-surface-900 mb-2">{title}</h2>
            <p className="text-surface-500 max-w-sm mb-8 text-sm">
                {message}
            </p>

            {actionVisible && (
                <Button
                    variant="primary"
                    size="md"
                    icon={Plus}
                    onClick={() => navigate('/new')}
                >
                    Create New Analysis
                </Button>
            )}
        </div>
    );
}
