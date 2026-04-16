import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Card({
    children,
    className,
    hover = false,
    padding = 'md',
    ...props
}) {
    const paddings = {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8 md:p-10"
    };

    return (
        <div
            className={cn(
                "bg-white border border-surface-200 rounded-xl shadow-sm transition-all duration-200 dark:bg-wood-900/40 dark:border-white/5 dark:shadow-none dark:glass-panel",
                hover && "hover:border-surface-300 hover:shadow-md dark:hover:border-white/10 dark:hover:shadow-lg dark:hover:shadow-black/50",
                paddings[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
