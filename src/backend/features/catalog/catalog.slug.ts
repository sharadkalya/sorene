/**
 * Turn a human-readable name into a URL-safe slug. Kept in its own module so
 * the transformation is pure and unit-testable without touching the database.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
