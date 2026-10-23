import { describe, expect, it } from 'vitest';
import {
  categoryInputSchema,
  productCreateSchema,
  productUpdateSchema,
} from './catalog.validation';

describe('catalog validation', () => {
  it('accepts a valid category', () => {
    const result = categoryInputSchema.safeParse({ name: 'Tote Bags', isActive: true });
    expect(result.success).toBe(true);
  });

  it('rejects a category without a name', () => {
    const result = categoryInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts a valid product and applies defaults', () => {
    const result = productCreateSchema.safeParse({
      name: 'The Arch Bag',
      description: 'A structured handbag.',
      price: 240,
      categories: ['cat1', 'cat2'],
      collections: ['col1'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
      expect(result.data.images).toEqual([]);
      expect(result.data.featured).toBe(false);
    }
  });

  it('rejects a negative price', () => {
    const result = productCreateSchema.safeParse({
      name: 'Bag',
      description: 'Desc',
      price: -5,
    });
    expect(result.success).toBe(false);
  });

  it('allows partial updates', () => {
    const result = productUpdateSchema.safeParse({ price: 300 });
    expect(result.success).toBe(true);
  });

  it('limits images to 12', () => {
    const result = productCreateSchema.safeParse({
      name: 'Bag',
      description: 'Desc',
      price: 100,
      images: Array.from({ length: 13 }, (_, index) => `https://example.com/${index}.jpg`),
    });
    expect(result.success).toBe(false);
  });

  it('defaults stockQuantity to 0 and accepts the optional detail fields', () => {
    const result = productCreateSchema.safeParse({
      name: 'Bag',
      description: 'Desc',
      price: 100,
      materialInfo: 'Full-grain leather',
      manufacturingInfo: 'Handcrafted in Kolkata',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stockQuantity).toBe(0);
      expect(result.data.materialInfo).toBe('Full-grain leather');
      expect(result.data.manufacturingInfo).toBe('Handcrafted in Kolkata');
    }
  });

  it('coerces a numeric string stockQuantity to a number', () => {
    const result = productCreateSchema.safeParse({
      name: 'Bag',
      description: 'Desc',
      price: 100,
      stockQuantity: '7',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stockQuantity).toBe(7);
    }
  });

  it('rejects a negative stockQuantity', () => {
    const result = productCreateSchema.safeParse({
      name: 'Bag',
      description: 'Desc',
      price: 100,
      stockQuantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer stockQuantity', () => {
    const result = productCreateSchema.safeParse({
      name: 'Bag',
      description: 'Desc',
      price: 100,
      stockQuantity: 2.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects material info over 500 characters', () => {
    const result = productCreateSchema.safeParse({
      name: 'Bag',
      description: 'Desc',
      price: 100,
      materialInfo: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('rejects manufacturing info over 500 characters', () => {
    const result = productCreateSchema.safeParse({
      name: 'Bag',
      description: 'Desc',
      price: 100,
      manufacturingInfo: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
