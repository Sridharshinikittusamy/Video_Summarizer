import { motion } from 'framer-motion';

export default function Spinner({ size = 'md', className }) {
    const sizes = {
        sm: "w-5 h-5 border-2",
        md: "w-10 h-10 border-4",
        lg: "w-16 h-16 border-4"
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className={`${sizes[size]} border-accent-gold/20 border-t-accent-gold rounded-full shadow-[0_0_15px_rgba(212,163,115,0.3)]`}
            />
        </div>
    );
}
