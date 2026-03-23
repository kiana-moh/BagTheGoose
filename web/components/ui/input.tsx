import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-shell bg-white px-4 text-sm text-ink-950 outline-none transition placeholder:text-black/35 focus:border-[#d7b347] focus:ring-2 focus:ring-[#f2e7b5]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
