import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./components/ThemeProvider";
import connectDB from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";

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

async function getTheme() {
  // During build or when DB is not available, use default theme
  if (!process.env.MONGODB_URI || process.env.NEXT_PHASE === 'phase-production-build') {
    return 'sorvene';
  }

  try {
    const db = await connectDB();
    if (!db) {
      return 'sorvene';
    }
    
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({ theme: 'sorvene' });
    }
    return settings.theme;
  } catch (error) {
    console.error('Error fetching theme:', error);
    return 'sorvene';
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();
  
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
