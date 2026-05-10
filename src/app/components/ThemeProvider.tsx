'use client';

import { useEffect, useState } from 'react';

export default function ThemeProvider({ 
  children,
  initialTheme = 'sorvene'
}: { 
  children: React.ReactNode;
  initialTheme?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set initial theme
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Listen for theme changes
    const handleThemeChange = (event: CustomEvent) => {
      document.documentElement.setAttribute('data-theme', event.detail.theme);
    };

    window.addEventListener('themeChange' as any, handleThemeChange);
    return () => {
      window.removeEventListener('themeChange' as any, handleThemeChange);
    };
  }, [initialTheme]);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
