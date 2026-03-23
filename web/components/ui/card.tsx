import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-[26px] border border-shell bg-panel-white shadow-panel backdrop-blur", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-shell px-6 py-5">
      <div>
        <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-ink-950">{title}</h2>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardContent({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}
