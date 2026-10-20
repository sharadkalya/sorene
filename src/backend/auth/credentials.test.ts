import { afterEach, describe, expect, it } from 'vitest';
import { isAdminAuthConfigured, verifyAdminCredentials } from './credentials';

const originalEnv = process.env;

afterEach(() => {
  process.env = originalEnv;
});

describe('verifyAdminCredentials', () => {
  it('accepts matching credentials', () => {
    process.env = { ...originalEnv, ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'secret-pw' };
    expect(isAdminAuthConfigured()).toBe(true);
    expect(verifyAdminCredentials('admin', 'secret-pw')).toBe(true);
  });

  it('rejects wrong username or password', () => {
    process.env = { ...originalEnv, ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'secret-pw' };
    expect(verifyAdminCredentials('admin', 'wrong')).toBe(false);
    expect(verifyAdminCredentials('wrong', 'secret-pw')).toBe(false);
  });

  it('rejects empty credentials', () => {
    process.env = { ...originalEnv, ADMIN_USERNAME: '', ADMIN_PASSWORD: '' };
    expect(verifyAdminCredentials('', '')).toBe(false);
  });

  it('disables login when credentials are not configured', () => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    expect(isAdminAuthConfigured()).toBe(false);
    expect(verifyAdminCredentials('admin', 'secret-pw')).toBe(false);
  });
});
