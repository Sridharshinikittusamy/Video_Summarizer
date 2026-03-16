import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    loading,
    icon: Icon,
    as: Component = 'button',
    to,
    href,
    ...props
}) {
    const variants = {
        primary: "bg-accent-gold hover:bg-white text-wood-950 shadow-xl shadow-accent-gold/10 border-accent-gold/20 font-black tracking-widest uppercase",
        secondary: "bg-wood-800 hover:bg-wood-700 text-wood-100 border-white/5 shadow-inner",
        ghost: "bg-transparent hover:bg-white/5 text-wood-500 hover:text-accent-gold border-transparent",
        danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20",
        glass: "bg-white/5 hover:bg-white/10 text-white backdrop-blur-md border-white/10"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
        md: "px-5 py-2.5 text-sm rounded-xl gap-2",
        lg: "px-8 py-4 text-base rounded-2xl gap-3"
    };

    const baseStyles = cn(
        "relative flex items-center justify-center font-bold transition-all border outline-none focus:ring-2 focus:ring-accent-gold/40 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
    );

    const content = (
        <>
            {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} />}
                    {children}
                </>
            )}
        </>
    );

    // If "as" is a Link (from react-router-dom)
    if (Component === Link) {
        return (
            <motion.div
                whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
                whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
                className="inline-block"
            >
                <Link to={to} className={baseStyles} {...props}>
                    {content}
                </Link>
            </motion.div>
        );
    }

    // If "as" is an anchor tag
    if (Component === 'a') {
        return (
            <motion.div
                whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
                whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
                className="inline-block"
            >
                <a href={href} className={baseStyles} {...props}>
                    {content}
                </a>
            </motion.div>
        );
    }

    return (
        <motion.button
            whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            className={baseStyles}
            disabled={disabled || loading}
            {...props}
        >
            {content}
        </motion.button>
    );
}
