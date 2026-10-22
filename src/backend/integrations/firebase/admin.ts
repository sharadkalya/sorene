import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseClientEmail, getFirebasePrivateKey, getFirebaseProjectId } from '@/common/env';

/**
 * Firebase Admin SDK integration.
 *
 * NOTE: Currently has no callers. Customer sign-in moved to WhatsApp OTP
 * (`backend/features/customer/otp.service.ts`); this module is kept so a
 * future Firebase-backed flow can be added without re-wiring dependencies.
 *
 * Initializes lazily so `next build` and requests that never touch Firebase
 * don't require service-account config. Credentials come from a service-account
 * key (see `.env.example`).
 */

let app: App | null = null;

function getAdminApp(): App {
  if (app) {
    return app;
  }
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }
  app = initializeApp({
    credential: cert({
      projectId: getFirebaseProjectId(),
      clientEmail: getFirebaseClientEmail(),
      privateKey: getFirebasePrivateKey().replace(/\\n/g, '\n'),
    }),
  });
  return app;
}

/** Verify a client Firebase Auth ID token and return the verified phone number. */
export async function verifyIdToken(idToken: string): Promise<{ phoneNumber: string }> {
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
  if (!decoded.phone_number) {
    throw new Error('Firebase ID token does not contain a phone number');
  }
  return { phoneNumber: decoded.phone_number };
}
