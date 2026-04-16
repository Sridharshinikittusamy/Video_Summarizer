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
        primary: "bg-brand-500 hover:bg-brand-600 text-white shadow-sm border-transparent font-medium dark:text-wood-950 dark:shadow-lg dark:shadow-brand-500/20",
        secondary: "bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-sm font-medium dark:bg-wood-900/40 dark:hover:bg-wood-800/40 dark:text-wood-300 dark:border-white/5",
        ghost: "bg-transparent hover:bg-surface-100 text-surface-600 font-medium dark:hover:bg-white/5 dark:text-wood-500 dark:hover:text-wood-200",
        danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-medium dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-500 dark:border-red-500/20",
        glass: "bg-white/80 hover:bg-white text-surface-900 border border-surface-200 font-medium backdrop-blur-md dark:bg-wood-950/40 dark:hover:bg-wood-900 dark:border-white/5 dark:text-wood-100"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
        md: "px-4 py-2 text-sm rounded-lg gap-2",
        lg: "px-6 py-3 text-base rounded-lg gap-2"
    };

    const baseStyles = cn(
        "relative flex items-center justify-center transition-colors border outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
    );

    const content = (
        <>
            {loading ? (
                <div className="w-4 h-4 border-2 border-surface-300 border-t-sage-600 rounded-full animate-spin" />
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
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            className={baseStyles}
            disabled={disabled || loading}
            {...props}
        >
            {content}
        </motion.button>
    );
}
