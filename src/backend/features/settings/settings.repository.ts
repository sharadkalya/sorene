import { getMongoConnection } from '@/backend/integrations/database/connection';
import SiteSettingsModel from '@/backend/integrations/database/models/SiteSettings';
import { DEFAULT_THEME } from '@/common/themes';

/** Persistence for the single site-settings document. */

export async function getOrCreateSettings(): Promise<{ theme: string }> {
  await getMongoConnection();
  let doc = await SiteSettingsModel.findOne();
  if (!doc) {
    doc = await SiteSettingsModel.create({ theme: DEFAULT_THEME });
  }
  return { theme: doc.theme };
}

export async function updateSettingsTheme(theme: string): Promise<{ theme: string }> {
  await getMongoConnection();
  let doc = await SiteSettingsModel.findOne();
  if (!doc) {
    doc = await SiteSettingsModel.create({ theme });
  } else {
    doc.theme = theme;
    await doc.save();
  }
  return { theme: doc.theme };
}
