import { describe, expect, it } from 'vitest';
import { slugify } from './catalog.slug';

describe('slugify', () => {
  it('lowercases and replaces non-alphanumerics with dashes', () => {
    expect(slugify('Tote Bags')).toBe('tote-bags');
    expect(slugify('Structured & Intentional!')).toBe('structured-intentional');
  });

  it('collapses runs of separators and trims edges', () => {
    expect(slugify('  The   Arch  Bag  ')).toBe('the-arch-bag');
  });

  it('caps slug length', () => {
    expect(slugify('a'.repeat(200))).toHaveLength(80);
  });
});
