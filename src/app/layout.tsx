import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import ThemeProvider from "./components/ThemeProvider";
import connectDB from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";

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

async function getTheme() {
  // During build phase, use default theme
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return 'sorvene';
  }

  // Check if MongoDB URI is available
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set, using default theme');
    return 'sorvene';
  }

  try {
    const db = await connectDB();
    if (!db) {
      console.warn('MongoDB connection failed, using default theme');
      return 'sorvene';
    }
    
    let settings = await SiteSettings.findOne();
    if (!settings) {
      console.log('No theme settings found, creating default');
      settings = await SiteSettings.create({ theme: 'sorvene' });
    }
    
    console.log('Theme loaded from DB:', settings.theme);
    return settings.theme;
  } catch (error) {
    console.error('Error fetching theme from DB:', error);
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
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`} data-theme={theme} suppressHydrationWarning>
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
