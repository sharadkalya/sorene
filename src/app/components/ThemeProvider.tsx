'use client';

import { useEffect, useLayoutEffect } from 'react';

export default function ThemeProvider({ 
  children,
  initialTheme = 'sorvene'
}: { 
  children: React.ReactNode;
  initialTheme?: string;
}) {
  // Apply theme from localStorage if it exists, before first paint
  useLayoutEffect(() => {
    const cachedTheme = localStorage.getItem('theme');
    if (cachedTheme) {
      // Only update if different from server-rendered theme
      if (cachedTheme !== initialTheme) {
        document.documentElement.setAttribute('data-theme', cachedTheme);
      }
    } else {
      // First time visitor - save the server theme to localStorage
      localStorage.setItem('theme', initialTheme);
    }
  }, [initialTheme]);

  useEffect(() => {
    // Fetch the latest theme from API to sync any changes
    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.success && data.data?.theme) {
          const fetchedTheme = data.data.theme;
          const cachedTheme = localStorage.getItem('theme');
          
          // Update if DB theme is different from cached theme
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
