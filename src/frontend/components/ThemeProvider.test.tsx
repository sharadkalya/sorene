// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ThemeProvider from './ThemeProvider';

function mockFetchTheme(theme: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { theme } }),
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ThemeProvider', () => {
  it('renders its children', () => {
    mockFetchTheme('sorvene');
    render(
      <ThemeProvider initialTheme="sorvene">
        <div>Hello Sorvene</div>
      </ThemeProvider>,
    );
    expect(screen.getByText('Hello Sorvene')).toBeTruthy();
  });

  it('applies the theme fetched from the API', async () => {
    mockFetchTheme('dark');
    render(
      <ThemeProvider initialTheme="sorvene">
        <div>Hello</div>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('persists the initial theme when no cached theme exists', () => {
    mockFetchTheme('sorvene');
    render(
      <ThemeProvider initialTheme="luxury">
        <div>Hello</div>
      </ThemeProvider>,
    );
    expect(localStorage.getItem('theme')).toBe('luxury');
  });
});
