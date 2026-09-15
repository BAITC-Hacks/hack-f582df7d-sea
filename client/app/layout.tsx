import "@/styles/globals.css";
import { Metadata } from "next";

import { Providers } from "./providers";

import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Tiyn — учёт расходов",
  description: "Tiyn: учёт личных расходов по месяцам и категориям",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="ru">
      <head />
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
