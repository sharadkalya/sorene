import { describe, expect, it } from 'vitest';
import { slugify } from './blog.slug';

describe('blog slugify', () => {
  it('lowercases and replaces non-alphanumerics with hyphens', () => {
    expect(slugify('The Arch Bag')).toBe('the-arch-bag');
    expect(slugify('  Quiet  Luxury!  ')).toBe('quiet-luxury');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('---Hello World---')).toBe('hello-world');
  });

  it('returns an empty string for symbol-only input', () => {
    expect(slugify('!!!')).toBe('');
  });

  it('caps the slug length at 120 characters', () => {
    expect(slugify('a'.repeat(200)).length).toBe(120);
  });
});
