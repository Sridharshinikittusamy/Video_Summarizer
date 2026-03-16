import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Badge({
    children,
    variant = 'default',
    className,
    ...props
}) {
    const variants = {
        default: "bg-white/5 text-wood-400 border-white/5",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        error: "bg-red-500/10 text-red-400 border-red-500/20",
        indigo: "bg-accent-gold/10 text-accent-gold border-accent-gold/20",
        gold: "bg-accent-gold/20 text-accent-gold border-accent-gold/30",
        wood: "bg-wood-800/40 text-wood-200 border-wood-700/50",
        premium: "bg-gradient-to-r from-accent-gold/20 to-wood-500/20 text-accent-gold border-accent-gold/30 shadow-lg shadow-accent-gold/5"
    };

    return (
        <span
            className={cn(
                "px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border rounded-full inline-flex items-center justify-center backdrop-blur-md",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
