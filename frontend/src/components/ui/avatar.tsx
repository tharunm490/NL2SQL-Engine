import { forwardRef } from "react";
import { cn } from "@/utils/cn";

interface AvatarProps {
  name: string;
  className?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, className }, ref) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground items-center justify-center text-xs font-semibold",
          className
        )}
      >
        {initials}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
