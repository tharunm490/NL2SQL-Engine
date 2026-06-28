import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface DropdownMenuProps {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <div className="relative inline-block">{children}</div>;
}

export function DropdownMenuTrigger({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="cursor-pointer">
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  open,
  className,
  align = "end",
}: {
  children: ReactNode;
  open: boolean;
  className?: string;
  align?: "start" | "end";
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" />
      <div
        className={cn(
          "absolute z-50 mt-1 min-w-[12rem] rounded-md border bg-popover p-1 shadow-md",
          align === "end" ? "right-0" : "left-0",
          className
        )}
      >
        {children}
      </div>
    </>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
