import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth';

/**
 * Lazy Firebase web client for phone OTP.
 *
 * NOTE: Currently has no callers. Customer sign-in moved to WhatsApp OTP
 * (`backend/features/customer/otp.service.ts`); this module is kept so a future
 * Firebase-backed flow can be added without re-wiring dependencies.
 * The app is only initialized once `sendOtp` is actually called, so a
 * storefront visit never pays the SDK cost.
 */

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (auth) {
    return auth;
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error('Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* variables.');
  }

  app = getApps().length > 0 ? getApp() : initializeApp(config);
  auth = getAuth(app);
  return auth;
}

/** Send an OTP to `phone` (E.164) using the invisible reCAPTCHA in `containerId`. */
export function sendOtp(phone: string, containerId: string): Promise<ConfirmationResult> {
  const verifier = new RecaptchaVerifier(getFirebaseAuth(), containerId, { size: 'invisible' });
  return signInWithPhoneNumber(getFirebaseAuth(), phone, verifier);
}
