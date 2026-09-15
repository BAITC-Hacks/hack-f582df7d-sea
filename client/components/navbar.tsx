"use client";

import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

export const Navbar = () => (
  <nav className="sticky top-0 z-40 w-full border-b border-separator bg-background/70 backdrop-blur-lg">
    <header className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">💸</span>
        <div className="leading-tight">
          <p className="font-bold">{siteConfig.name}</p>
          <p className="hidden text-xs text-muted sm:block">{siteConfig.description}</p>
        </div>
      </div>
      <ThemeSwitch />
    </header>
  </nav>
);
