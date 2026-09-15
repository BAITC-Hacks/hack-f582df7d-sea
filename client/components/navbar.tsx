"use client";

import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

export const Navbar = () => (
  <nav className="sticky top-0 z-40 w-full border-b border-separator/60 bg-background/70 backdrop-blur-xl">
    <header className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-xl">💸</span>
        <div className="leading-tight">
          <p className="font-bold tracking-tight">{siteConfig.name}</p>
          <p className="hidden text-xs text-muted sm:block">{siteConfig.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <a className="hidden text-xs text-muted hover:text-foreground sm:block" href="http://localhost:8001/docs" rel="noreferrer" target="_blank">
          API docs
        </a>
        <ThemeSwitch />
      </div>
    </header>
  </nav>
);
