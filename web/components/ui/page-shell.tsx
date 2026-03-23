import { cn } from "@/lib/utils";

export function PageShell({
  title,
  description,
  actions,
  children,
  className
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-7", className)}>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f6d14]">
            BagTheGoose
          </p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-[-0.055em] text-ink-950 md:text-[46px]">
            {title}
          </h1>
          {description ? <p className="mt-3 text-sm leading-7 text-muted md:text-[15px]">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
