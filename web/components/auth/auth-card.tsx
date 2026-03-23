import Link from "next/link";
import type { Route } from "next";
import { Card, CardContent } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  footerLabel,
  footerLink,
  footerText,
  children
}: {
  title: string;
  description: string;
  footerLabel: string;
  footerLink: Route;
  footerText: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-[440px] bg-white/95">
      <CardContent className="space-y-8 p-9 md:p-10">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ead9a1] bg-[#fcf4da] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#866712]">
            <span>🪿</span>
            <span>BagTheGoose</span>
          </div>
          <div>
            <h1 className="text-[36px] font-semibold tracking-[-0.06em] text-ink-950">{title}</h1>
            <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
          </div>
        </div>
        {children}
        <p className="text-sm text-muted">
          {footerText}{" "}
          <Link href={footerLink} className="font-medium text-ink-950 underline decoration-[#d8bf6a] underline-offset-4 hover:decoration-[#a78318]">
            {footerLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
