import { timingSafeEqual } from 'node:crypto';
import { getAdminPassword, getAdminUsername } from '@/common/env';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Admin login is only available when both credentials are configured. */
export function isAdminAuthConfigured(): boolean {
  return Boolean(getAdminUsername() && getAdminPassword());
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = getAdminUsername();
  const expectedPass = getAdminPassword();
  if (!expectedUser || !expectedPass) {
    return false;
  }
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}
