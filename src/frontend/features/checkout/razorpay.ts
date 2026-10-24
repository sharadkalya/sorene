/**
 * Minimal, typed wrapper around Razorpay's hosted checkout script. Kept small
 * and framework-free so the payment panel stays easy to swap for another
 * provider later.
 */

export const RAZORPAY_CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; contact?: string; email?: string };
  notes?: Record<string, string>;
  modal?: { ondismiss?: () => void };
  retry?: { enabled?: boolean; max_count?: number };
}

export interface RazorpayCheckoutInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Load the Razorpay checkout script exactly once; resolves when it is ready. */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Payment checkout is unavailable.'));
  }
  if (window.Razorpay) {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load the payment checkout. Please try again.'));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

/** Open a Razorpay checkout modal. Throws if the script has not loaded. */
export function openRazorpayCheckout(options: RazorpayCheckoutOptions): void {
  const RazorpayCtor = window.Razorpay;
  if (!RazorpayCtor) {
    throw new Error('Payment checkout is not ready. Please try again.');
  }
  new RazorpayCtor(options).open();
}
