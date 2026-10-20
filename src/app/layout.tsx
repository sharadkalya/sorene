import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/frontend/components/ThemeProvider";
import StoreProvider from "@/frontend/store/StoreProvider";
import { getTheme } from "@/backend/features/settings/settings.service";

// Force dynamic rendering to always fetch latest theme
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-cormorant',
});

const jost = Jost({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-jost',
});

export const metadata: Metadata = {
  title: "SORvÈNE — Quiet Luxury Handbags",
  description: "Structured bags made with uncompromising intention. Premium leather, hand-finished, priced fairly.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();
  
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`} data-theme={theme} suppressHydrationWarning>
      <body>
        <StoreProvider>
          <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
