import "@/styles/globals.css";
import { Metadata, Viewport } from "next";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="ru">
      <head />
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,var(--color-accent)_0%,transparent_60%)] opacity-[0.10]" />
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="container mx-auto w-full max-w-[1200px] flex-grow px-4 py-6 sm:px-6">{children}</main>
            <footer className="w-full py-5 text-center text-xs text-muted">
              HackAlem AI · Учёт личных расходов студента · все суммы в одной валюте (₸)
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
