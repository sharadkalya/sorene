import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./r2-client', () => ({
  getR2Client: vi.fn(),
}));

import { getR2Client } from './r2-client';
import { checkStorageHealth } from './r2-storage';

const getR2ClientMock = vi.mocked(getR2Client);

function fakeClient() {
  return { send: vi.fn() };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.R2_BUCKET_NAME = 'test-bucket';
});

describe('checkStorageHealth', () => {
  it('reports ok after a successful upload and delete', async () => {
    const client = fakeClient();
    client.send.mockResolvedValue({});
    getR2ClientMock.mockReturnValue(client as never);

    const result = await checkStorageHealth();

    expect(result.ok).toBe(true);
    expect(result.deleted).toBe(true);
    expect(result.bucket).toBe('test-bucket');
    expect(result.key).toMatch(/^status-checks\/.+\.png$/);
    expect(client.send).toHaveBeenCalledTimes(2);
  });

  it('reports a failure when the upload fails', async () => {
    const client = fakeClient();
    client.send.mockRejectedValueOnce(new Error('403 Forbidden'));
    getR2ClientMock.mockReturnValue(client as never);

    const result = await checkStorageHealth();

    expect(result.ok).toBe(false);
    expect(result.deleted).toBe(false);
    expect(result.error).toContain('403 Forbidden');
  });

  it('reports a failure when the delete fails', async () => {
    const client = fakeClient();
    client.send.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('delete failed'));
    getR2ClientMock.mockReturnValue(client as never);

    const result = await checkStorageHealth();

    expect(result.ok).toBe(false);
    expect(result.deleted).toBe(false);
    expect(result.error).toContain('delete failed');
  });

  it('reports missing configuration without throwing', async () => {
    delete process.env.R2_BUCKET_NAME;

    const result = await checkStorageHealth();

    expect(result.ok).toBe(false);
    expect(result.error).toContain('R2_BUCKET_NAME');
  });
});
