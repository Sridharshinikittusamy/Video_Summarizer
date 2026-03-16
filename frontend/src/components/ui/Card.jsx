import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Card({
    children,
    className,
    glass = true,
    hover = true,
    padding = 'md',
    ...props
}) {
    const paddings = {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8 md:p-12"
    };

    return (
        <div
            className={cn(
                "rounded-[2rem] border transition-all duration-300",
                glass ? "bg-wood-900/40 border-white/5 backdrop-blur-xl shadow-2xl shadow-black/40" : "bg-wood-950 border-white/10 shadow-2xl shadow-black/60",
                hover && "hover:border-accent-gold/30 hover:shadow-accent-gold/5",
                paddings[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
