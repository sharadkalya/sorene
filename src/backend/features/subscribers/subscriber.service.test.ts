import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./subscriber.repository', () => ({
  upsertSubscriber: vi.fn(),
  listSubscribers: vi.fn(),
}));

vi.mock('@/backend/integrations/email/email-client', () => ({
  sendStayTunedEmail: vi.fn(),
}));

import { upsertSubscriber, listSubscribers } from './subscriber.repository';
import { sendStayTunedEmail } from '@/backend/integrations/email/email-client';
import { AppError } from '@/backend/errors';
import { getSubscribers, registerInterest } from './subscriber.service';

const upsertSubscriberMock = vi.mocked(upsertSubscriber);
const listSubscribersMock = vi.mocked(listSubscribers);
const sendStayTunedEmailMock = vi.mocked(sendStayTunedEmail);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registerInterest', () => {
  it('throws a validation error for invalid input', async () => {
    await expect(registerInterest({ name: 'J', email: 'nope' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'VALIDATION_ERROR',
      status: 400,
    });
    expect(upsertSubscriberMock).not.toHaveBeenCalled();
  });

  it('creates a subscriber and sends the email', async () => {
    upsertSubscriberMock.mockResolvedValue({
      subscriber: {
        id: '1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        discountCode: expect.any(String) as string,
        count: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      created: true,
    });

    const result = await registerInterest({ name: 'Jane Doe', email: 'Jane@Example.com' });

    expect(result.created).toBe(true);
    expect(upsertSubscriberMock).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      discountCode: expect.stringMatching(/^SORVENE-[A-Z2-9]{6}$/),
    });
    expect(sendStayTunedEmailMock).toHaveBeenCalledTimes(1);
  });

  it('returns created=false for an existing subscriber', async () => {
    upsertSubscriberMock.mockResolvedValue({
      subscriber: {
        id: '1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        discountCode: 'SORVENE-ABC123',
        count: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      created: false,
    });

    const result = await registerInterest({ name: 'Jane Doe', email: 'jane@example.com' });
    expect(result.created).toBe(false);
  });

  it('still succeeds when email delivery fails (subscriber is persisted first)', async () => {
    upsertSubscriberMock.mockResolvedValue({
      subscriber: {
        id: '1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        discountCode: 'SORVENE-ABC123',
        count: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      created: true,
    });
    sendStayTunedEmailMock.mockRejectedValue(new Error('provider down'));

    await expect(
      registerInterest({ name: 'Jane Doe', email: 'jane@example.com' }),
    ).resolves.toMatchObject({ created: true });
  });

  it('propagates persistence failures', async () => {
    upsertSubscriberMock.mockRejectedValue(new Error('db down'));
    await expect(
      registerInterest({ name: 'Jane Doe', email: 'jane@example.com' }),
    ).rejects.toThrow('db down');
    expect(sendStayTunedEmailMock).not.toHaveBeenCalled();
  });
});

describe('getSubscribers', () => {
  it('delegates to the repository', async () => {
    const records = [{ id: '1', name: 'Jane', email: 'jane@example.com' }];
    listSubscribersMock.mockResolvedValue(records as never);

    await expect(getSubscribers()).resolves.toBe(records);
    expect(listSubscribersMock).toHaveBeenCalledTimes(1);
  });
});

describe('AppError import sanity', () => {
  it('exports the typed error used by the service', () => {
    expect(new AppError('CONFLICT', 'dup').code).toBe('CONFLICT');
  });
});
