import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/integrations/database/connection', () => ({
  getMongoConnection: vi.fn(),
}));

vi.mock('@/backend/integrations/database/models/Subscriber', () => ({
  default: { findOneAndUpdate: vi.fn(), find: vi.fn() },
}));

import { getMongoConnection } from '@/backend/integrations/database/connection';
import SubscriberModel from '@/backend/integrations/database/models/Subscriber';
import { listSubscribers, upsertSubscriber } from './subscriber.repository';

const getMongoConnectionMock = vi.mocked(getMongoConnection);
const findOneAndUpdateMock = vi.mocked(SubscriberModel.findOneAndUpdate);
const findMock = vi.mocked(SubscriberModel.find);

function fakeDoc(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: { toString: () => '1' },
    name: 'Jane Doe',
    email: 'jane@example.com',
    discountCode: 'SORVENE-ABC123',
    count: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('upsertSubscriber', () => {
  it('connects to the database before querying', async () => {
    findOneAndUpdateMock.mockResolvedValue({ value: fakeDoc(), lastErrorObject: { upserted: '1' } } as never);

    await upsertSubscriber({ name: 'Jane Doe', email: 'jane@example.com', discountCode: 'SORVENE-ABC123' });

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
  });

  it('reports created=true for a new subscriber (upsert)', async () => {
    findOneAndUpdateMock.mockResolvedValue({
      value: fakeDoc(),
      lastErrorObject: { upserted: '1' },
    } as never);

    const result = await upsertSubscriber({
      name: 'Jane Doe',
      email: 'jane@example.com',
      discountCode: 'SORVENE-ABC123',
    });

    expect(result.created).toBe(true);
    expect(result.subscriber.email).toBe('jane@example.com');
    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { email: 'jane@example.com' },
      { $set: { name: 'Jane Doe', discountCode: 'SORVENE-ABC123' }, $inc: { count: 1 } },
      expect.objectContaining({ upsert: true, includeResultMetadata: true }),
    );
  });

  it('reports created=false when the subscriber already existed', async () => {
    findOneAndUpdateMock.mockResolvedValue({
      value: fakeDoc({ count: 2 }),
      lastErrorObject: {},
    } as never);

    const result = await upsertSubscriber({
      name: 'Jane Doe',
      email: 'jane@example.com',
      discountCode: 'SORVENE-ABC123',
    });

    expect(result.created).toBe(false);
    expect(result.subscriber.count).toBe(2);
  });
});

describe('listSubscribers', () => {
  it('connects to the database and returns mapped records sorted by the query', async () => {
    const sortMock = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([fakeDoc()]) });
    findMock.mockReturnValue({ sort: sortMock } as never);

    const result = await listSubscribers();

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual([
      {
        id: '1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        discountCode: 'SORVENE-ABC123',
        count: 1,
        createdAt: new Date('2026-01-01').toISOString(),
        updatedAt: new Date('2026-01-01').toISOString(),
      },
    ]);
  });
});
