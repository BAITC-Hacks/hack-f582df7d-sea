import "@/styles/globals.css";
import { Metadata } from "next";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="ru">
      <head />
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <Navbar />
          <main className="mx-auto w-full max-w-[1040px] px-4 pb-16 pt-2 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
