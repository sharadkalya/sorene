import { describe, expect, it } from 'vitest';
import { themeSchema } from './settings.validation';

describe('themeSchema', () => {
  it('accepts every configured theme', () => {
    for (const theme of ['sorvene', 'light', 'dark', 'luxury']) {
      expect(themeSchema.safeParse(theme).success).toBe(true);
    }
  });

  it('rejects unknown themes', () => {
    expect(themeSchema.safeParse('not-a-theme').success).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(themeSchema.safeParse(42).success).toBe(false);
    expect(themeSchema.safeParse(null).success).toBe(false);
    expect(themeSchema.safeParse(undefined).success).toBe(false);
  });
});
