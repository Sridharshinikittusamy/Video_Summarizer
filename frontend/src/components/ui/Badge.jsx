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
        default: "bg-surface-100 text-surface-600 border-surface-200 dark:bg-white/5 dark:border-white/5 dark:text-wood-400",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20 dark:text-emerald-400",
        warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20 dark:text-amber-400",
        error: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/5 dark:border-red-500/20 dark:text-red-400",
        brand: "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400",
    };

    return (
        <span
            className={cn(
                "px-2.5 py-0.5 text-xs font-medium border rounded-full inline-flex items-center justify-center",
                variants[variant] || variants.default,
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
