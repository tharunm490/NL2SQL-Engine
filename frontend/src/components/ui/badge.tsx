import { cn } from "@/utils/cn";

const variants = {
  default: "border-transparent bg-primary text-primary-foreground shadow",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
  outline: "text-foreground",
  success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warning: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
} as const;

interface BadgeProps {
  variant?: keyof typeof variants;
  className?: string;
  children: string;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
