import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BagTheGoose",
  description: "AI-powered internship search, resume analysis, and application tracking."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-shell-gradient font-sans text-ink-950 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
