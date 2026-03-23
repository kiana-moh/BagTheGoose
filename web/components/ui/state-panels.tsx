export function LoadingPanel({ title = "Loading…" }: { title?: string }) {
  return (
    <div className="rounded-[26px] border border-shell bg-panel-white px-6 py-5 text-sm text-muted shadow-panel">
      {title}
    </div>
  );
}

export function EmptyPanel({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[26px] border border-dashed border-shell bg-white px-6 py-8 text-center shadow-panel">
      <h3 className="text-base font-semibold tracking-[-0.02em] text-ink-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

export function ErrorPanel({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-rose-100 bg-white px-5 py-4 text-sm text-rose-700 shadow-panel">
      <p className="font-semibold">{title}</p>
      <p className="mt-1.5 leading-6">{description}</p>
    </div>
  );
}
