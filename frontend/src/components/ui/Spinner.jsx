import { motion } from 'framer-motion';

export default function Spinner({ size = 'md', className }) {
    const sizes = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4"
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className={`${sizes[size]} border-surface-200 border-t-sage-600 rounded-full`}
            />
        </div>
    );
}
