import { cn } from "@/lib/utils";

const badgeMap = {
  neutral: "border border-shell bg-white text-[#5f5c55]",
  success: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border border-[#f0ddb0] bg-[#fff7df] text-[#8b6610]",
  danger: "border border-rose-100 bg-rose-50 text-rose-700",
  accent: "border border-[#ecd897] bg-[#fbf4d8] text-[#75560a]"
} as const;

export function Badge({
  tone = "neutral",
  children
}: {
  tone?: keyof typeof badgeMap;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.01em]",
        badgeMap[tone]
      )}
    >
      {children}
    </span>
  );
}
