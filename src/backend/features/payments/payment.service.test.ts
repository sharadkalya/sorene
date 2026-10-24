import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/integrations/payments', () => ({
  getPaymentProvider: vi.fn(),
}));

vi.mock('../orders/orders.service', () => ({
  getCustomerOrder: vi.fn(),
  placeOrder: vi.fn(),
  resolveOrderTotal: vi.fn(),
}));

vi.mock('./payment.repository', () => ({
  createPayment: vi.fn(),
  getPaymentByProviderOrderId: vi.fn(),
  markPaymentPaid: vi.fn(),
  markPaymentFailed: vi.fn(),
}));

import { getPaymentProvider } from '@/backend/integrations/payments';
import { getCustomerOrder, placeOrder, resolveOrderTotal } from '../orders/orders.service';
import {
  createPayment as repoCreatePayment,
  getPaymentByProviderOrderId,
  markPaymentFailed,
  markPaymentPaid,
} from './payment.repository';
import { createPaymentOrder, verifyPayment } from './payment.service';

const getPaymentProviderMock = vi.mocked(getPaymentProvider);
const getCustomerOrderMock = vi.mocked(getCustomerOrder);
const placeOrderMock = vi.mocked(placeOrder);
const resolveOrderTotalMock = vi.mocked(resolveOrderTotal);
const repoCreatePaymentMock = vi.mocked(repoCreatePayment);
const getPaymentByProviderOrderIdMock = vi.mocked(getPaymentByProviderOrderId);
const markPaymentPaidMock = vi.mocked(markPaymentPaid);
const markPaymentFailedMock = vi.mocked(markPaymentFailed);

const fakeProvider = {
  id: 'razorpay',
  createOrder: vi.fn(),
  verifyPayment: vi.fn(),
};

const checkoutInput = { addressId: 'a1', items: [{ slug: 'the-arch-bag', quantity: 2 }] };

const order = {
  id: 'o1',
  number: 'SR-20261023-1234',
  status: 'pending' as const,
  items: [],
  subtotal: 480,
  total: 480,
  createdAt: '2026-10-23T00:00:00.000Z',
  address: {
    fullName: 'Jane Doe',
    phone: '+919876543210',
    line1: '12 Palm Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  },
};

const paymentRecord = {
  id: 'p1',
  provider: 'razorpay',
  providerOrderId: 'order_provider_1',
  customerId: 'c1',
  amountInPaise: 48000,
  currency: 'INR',
  status: 'created' as const,
  checkout: checkoutInput,
  createdAt: '2026-10-23T00:00:00.000Z',
  updatedAt: '2026-10-23T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  getPaymentProviderMock.mockReturnValue(fakeProvider as never);
});

describe('createPaymentOrder', () => {
  it('throws a validation error for missing input', async () => {
    await expect(createPaymentOrder('c1', {})).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(resolveOrderTotalMock).not.toHaveBeenCalled();
  });

  it('rejects a total below the minimum amount', async () => {
    resolveOrderTotalMock.mockResolvedValue(0.5);

    await expect(createPaymentOrder('c1', checkoutInput)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(fakeProvider.createOrder).not.toHaveBeenCalled();
  });

  it('propagates provider failures', async () => {
    resolveOrderTotalMock.mockResolvedValue(480);
    fakeProvider.createOrder.mockRejectedValue(
      Object.assign(new Error('provider down'), { code: 'UPSTREAM_ERROR', status: 502 }),
    );

    await expect(createPaymentOrder('c1', checkoutInput)).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
    });
    expect(repoCreatePaymentMock).not.toHaveBeenCalled();
  });

  it('resolves the amount server-side and persists the checkout', async () => {
    resolveOrderTotalMock.mockResolvedValue(480);
    fakeProvider.createOrder.mockResolvedValue({
      providerOrderId: 'order_provider_1',
      amountInPaise: 48000,
      currency: 'INR',
      publicKey: 'rzp_test_TestKey',
    });
    repoCreatePaymentMock.mockResolvedValue(paymentRecord);

    const result = await createPaymentOrder('c1', checkoutInput);

    expect(resolveOrderTotalMock).toHaveBeenCalledWith('c1', checkoutInput);
    expect(fakeProvider.createOrder).toHaveBeenCalledWith({
      amountInPaise: 48000,
      currency: 'INR',
      receipt: expect.any(String),
    });
    expect(repoCreatePaymentMock).toHaveBeenCalledWith({
      provider: 'razorpay',
      providerOrderId: 'order_provider_1',
      customerId: 'c1',
      amountInPaise: 48000,
      currency: 'INR',
      checkout: checkoutInput,
    });
    expect(result).toEqual({
      provider: 'razorpay',
      providerOrderId: 'order_provider_1',
      amountInPaise: 48000,
      currency: 'INR',
      publicKey: 'rzp_test_TestKey',
    });
  });
});

describe('verifyPayment', () => {
  const verification = {
    providerOrderId: 'order_provider_1',
    providerPaymentId: 'pay_provider_1',
    signature: 'a'.repeat(64),
  };

  it('throws a validation error for missing fields', async () => {
    await expect(verifyPayment('c1', {})).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(getPaymentByProviderOrderIdMock).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when the payment is unknown', async () => {
    getPaymentByProviderOrderIdMock.mockResolvedValue(null);

    await expect(verifyPayment('c1', verification)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(fakeProvider.verifyPayment).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when the payment belongs to another customer', async () => {
    getPaymentByProviderOrderIdMock.mockResolvedValue({ ...paymentRecord, customerId: 'other' });

    await expect(verifyPayment('c1', verification)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(fakeProvider.verifyPayment).not.toHaveBeenCalled();
  });

  it('returns success idempotently for an already-paid payment', async () => {
    getPaymentByProviderOrderIdMock.mockResolvedValue({ ...paymentRecord, status: 'paid', orderId: 'o1' });
    getCustomerOrderMock.mockResolvedValue(order);

    const result = await verifyPayment('c1', verification);

    expect(result).toEqual({
      verified: true,
      status: 'paid',
      orderId: 'o1',
      orderNumber: 'SR-20261023-1234',
    });
    expect(fakeProvider.verifyPayment).not.toHaveBeenCalled();
    expect(placeOrderMock).not.toHaveBeenCalled();
  });

  it('marks the payment failed and throws 400 when the signature does not match', async () => {
    getPaymentByProviderOrderIdMock.mockResolvedValue(paymentRecord);
    fakeProvider.verifyPayment.mockResolvedValue(false);

    await expect(verifyPayment('c1', verification)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });
    expect(markPaymentFailedMock).toHaveBeenCalledWith('order_provider_1');
    expect(placeOrderMock).not.toHaveBeenCalled();
    expect(markPaymentPaidMock).not.toHaveBeenCalled();
  });

  it('places the order and marks the payment paid when the signature matches', async () => {
    getPaymentByProviderOrderIdMock.mockResolvedValue(paymentRecord);
    fakeProvider.verifyPayment.mockResolvedValue(true);
    placeOrderMock.mockResolvedValue(order);
    markPaymentPaidMock.mockResolvedValue({ ...paymentRecord, status: 'paid', orderId: 'o1' });

    const result = await verifyPayment('c1', verification);

    expect(placeOrderMock).toHaveBeenCalledWith(
      'c1',
      checkoutInput,
      expect.objectContaining({
        provider: 'razorpay',
        providerPaymentId: 'pay_provider_1',
        amountInPaise: 48000,
        currency: 'INR',
      }),
    );
    expect(markPaymentPaidMock).toHaveBeenCalledWith('order_provider_1', 'pay_provider_1', 'o1');
    expect(result).toEqual({
      verified: true,
      status: 'paid',
      orderId: 'o1',
      orderNumber: 'SR-20261023-1234',
    });
  });

  it('rejects when the payment is missing checkout details', async () => {
    getPaymentByProviderOrderIdMock.mockResolvedValue({ ...paymentRecord, checkout: undefined });
    fakeProvider.verifyPayment.mockResolvedValue(true);

    await expect(verifyPayment('c1', verification)).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(placeOrderMock).not.toHaveBeenCalled();
  });
});

