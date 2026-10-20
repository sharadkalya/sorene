import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/integrations/database/connection', () => ({
  getMongoConnection: vi.fn(),
}));

vi.mock('@/backend/integrations/database/models/SiteSettings', () => ({
  default: { findOne: vi.fn(), create: vi.fn() },
}));

import { getMongoConnection } from '@/backend/integrations/database/connection';
import SiteSettingsModel from '@/backend/integrations/database/models/SiteSettings';
import { getOrCreateSettings, updateSettingsTheme } from './settings.repository';

const getMongoConnectionMock = vi.mocked(getMongoConnection);
const findOneMock = vi.mocked(SiteSettingsModel.findOne);
const createMock = vi.mocked(SiteSettingsModel.create);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getOrCreateSettings', () => {
  it('connects to the database before querying', async () => {
    findOneMock.mockResolvedValue({ theme: 'sorvene' } as never);

    await getOrCreateSettings();

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
  });

  it('creates a default document when none exists', async () => {
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ theme: 'sorvene' } as never);

    const result = await getOrCreateSettings();

    expect(result.theme).toBe('sorvene');
    expect(createMock).toHaveBeenCalledWith({ theme: 'sorvene' });
  });
});

describe('updateSettingsTheme', () => {
  it('connects to the database before querying', async () => {
    const save = vi.fn();
    findOneMock.mockResolvedValue({ theme: 'sorvene', save } as never);

    await updateSettingsTheme('dark');

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
