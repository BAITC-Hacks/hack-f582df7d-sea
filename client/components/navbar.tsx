"use client";

import { Link } from "@heroui/react";

import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

export const Navbar = () => (
  <header className="mx-auto flex h-14 w-full max-w-[1040px] items-center justify-between px-4 sm:px-6">
    <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
    <div className="flex items-center gap-2">
      <Link className="text-xs text-muted" href="http://localhost:8001/docs" rel="noreferrer" target="_blank">
        API
      </Link>
      <ThemeSwitch />
    </div>
  </header>
);
