import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/integrations/database/connection', () => ({
  getMongoConnection: vi.fn(),
}));

vi.mock('@/backend/integrations/database/models/Payment', () => ({
  default: { create: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn() },
}));

import { getMongoConnection } from '@/backend/integrations/database/connection';
import PaymentModel from '@/backend/integrations/database/models/Payment';
import {
  createPayment,
  getPaymentByProviderOrderId,
  markPaymentFailed,
  markPaymentPaid,
} from './payment.repository';

const getMongoConnectionMock = vi.mocked(getMongoConnection);
const createMock = vi.mocked(PaymentModel.create);
const findOneMock = vi.mocked(PaymentModel.findOne);
const findOneAndUpdateMock = vi.mocked(PaymentModel.findOneAndUpdate);

function fakeDoc(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: { toString: () => 'p1' },
    provider: 'razorpay',
    providerOrderId: 'order_provider_1',
    providerPaymentId: undefined,
    orderId: undefined,
    customerId: { toString: () => 'c1' },
    amountInPaise: 48000,
    currency: 'INR',
    status: 'created',
    checkout: { addressId: 'a1', items: [{ slug: 'the-arch-bag', quantity: 2 }] },
    createdAt: new Date('2026-10-23T00:00:00.000Z'),
    updatedAt: new Date('2026-10-23T00:00:00.000Z'),
    ...overrides,
  };
}

const data = {
  provider: 'razorpay',
  providerOrderId: 'order_provider_1',
  customerId: 'c1',
  amountInPaise: 48000,
  currency: 'INR',
  checkout: { addressId: 'a1', items: [{ slug: 'the-arch-bag', quantity: 2 }] },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createPayment', () => {
  it('connects before creating and persists with status created', async () => {
    createMock.mockResolvedValue(fakeDoc() as never);

    const result = await createPayment(data);

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({ ...data, status: 'created' });
    expect(result).toMatchObject({ id: 'p1', status: 'created', providerOrderId: 'order_provider_1' });
  });
});

describe('getPaymentByProviderOrderId', () => {
  it('returns the mapped record when found', async () => {
    const execMock = vi.fn().mockResolvedValue(fakeDoc());
    findOneMock.mockReturnValue({ exec: execMock } as never);

    const result = await getPaymentByProviderOrderId('order_provider_1');

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
    expect(findOneMock).toHaveBeenCalledWith({ providerOrderId: 'order_provider_1' });
    expect(result).toMatchObject({
      id: 'p1',
      customerId: 'c1',
      checkout: { addressId: 'a1' },
    });
  });

  it('returns null when not found', async () => {
    const execMock = vi.fn().mockResolvedValue(null);
    findOneMock.mockReturnValue({ exec: execMock } as never);

    await expect(getPaymentByProviderOrderId('missing')).resolves.toBeNull();
  });
});

describe('markPaymentPaid', () => {
  it('updates only a created payment and maps the record', async () => {
    const execMock = vi.fn().mockResolvedValue(
      fakeDoc({ status: 'paid', providerPaymentId: 'pay_1', orderId: { toString: () => 'o1' } }),
    );
    findOneAndUpdateMock.mockReturnValue({ exec: execMock } as never);

    const result = await markPaymentPaid('order_provider_1', 'pay_1', 'o1');

    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { providerOrderId: 'order_provider_1', status: 'created' },
      { $set: { providerPaymentId: 'pay_1', status: 'paid', orderId: 'o1' } },
      { new: true },
    );
    expect(result).toMatchObject({ status: 'paid', providerPaymentId: 'pay_1', orderId: 'o1' });
  });

  it('returns null when the payment was already paid (idempotent guard)', async () => {
    const execMock = vi.fn().mockResolvedValue(null);
    findOneAndUpdateMock.mockReturnValue({ exec: execMock } as never);

    await expect(markPaymentPaid('order_provider_1', 'pay_1', 'o1')).resolves.toBeNull();
  });
});

describe('markPaymentFailed', () => {
  it('marks only a created payment as failed', async () => {
    const execMock = vi.fn().mockResolvedValue(fakeDoc({ status: 'failed' }));
    findOneAndUpdateMock.mockReturnValue({ exec: execMock } as never);

    const result = await markPaymentFailed('order_provider_1');

    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { providerOrderId: 'order_provider_1', status: 'created' },
      { $set: { status: 'failed' } },
      { new: true },
    );
    expect(result).toMatchObject({ status: 'failed' });
  });
});
