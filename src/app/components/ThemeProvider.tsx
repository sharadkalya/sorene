'use client';

import { useEffect, useLayoutEffect } from 'react';

export default function ThemeProvider({ 
  children,
  initialTheme = 'sorvene'
}: { 
  children: React.ReactNode;
  initialTheme?: string;
}) {
  // Use useLayoutEffect to apply theme before paint (prevents flash)
  // This runs synchronously after DOM updates but before browser paint
  useLayoutEffect(() => {
    const cachedTheme = localStorage.getItem('theme');
    const themeToApply = cachedTheme || initialTheme;
    document.documentElement.setAttribute('data-theme', themeToApply);
  }, [initialTheme]);

  useEffect(() => {
    const cachedTheme = localStorage.getItem('theme');
    
    // Fetch the latest theme from API in the background
    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.success && data.data?.theme) {
          const fetchedTheme = data.data.theme;
          // Only update if different from cached theme
          if (fetchedTheme !== cachedTheme) {
            localStorage.setItem('theme', fetchedTheme);
            document.documentElement.setAttribute('data-theme', fetchedTheme);
          }
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
      }
    };

    fetchTheme();

    // Listen for theme changes from admin panel
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ theme: string }>;
      const newTheme = customEvent.detail.theme;
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, [initialTheme]);

  return <>{children}</>;
}
