'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ 
  children,
  initialTheme = 'sorvene'
}: { 
  children: React.ReactNode;
  initialTheme?: string;
}) {
  useEffect(() => {
    
    // Fetch the latest theme from API on mount
    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store', // Don't cache this request
        });
        const data = await response.json();
        if (data.success && data.data?.theme) {
          const fetchedTheme = data.data.theme;
          document.documentElement.setAttribute('data-theme', fetchedTheme);
        } else {
          // Fallback to initial theme
          document.documentElement.setAttribute('data-theme', initialTheme);
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
        // Fallback to initial theme
        document.documentElement.setAttribute('data-theme', initialTheme);
      }
    };

    fetchTheme();

    // Listen for theme changes from admin panel
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail.theme;
      document.documentElement.setAttribute('data-theme', newTheme);
    };

    window.addEventListener('themeChange' as any, handleThemeChange);
    return () => {
      window.removeEventListener('themeChange' as any, handleThemeChange);
    };
  }, [initialTheme]);

  return <>{children}</>;
}
