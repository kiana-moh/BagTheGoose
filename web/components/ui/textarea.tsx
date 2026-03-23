import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[160px] w-full rounded-[22px] border border-shell bg-white px-4 py-3 text-sm leading-6 text-ink-950 outline-none transition placeholder:text-black/35 focus:border-[#d7b347] focus:ring-2 focus:ring-[#f2e7b5]",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
