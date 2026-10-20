import { AppError } from '@/backend/errors';
import { isBuildPhase } from '@/common/env';
import { DEFAULT_THEME } from '@/common/themes';
import { getOrCreateSettings, updateSettingsTheme } from './settings.repository';
import { formatIssues, themeSchema } from './settings.validation';

/**
 * Resolve the active theme, tolerating the build phase and a missing/unreachable
 * database so that static rendering never hard-fails on theme lookup.
 */
export async function getTheme(): Promise<string> {
  if (isBuildPhase()) {
    return DEFAULT_THEME;
  }

  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set, using default theme');
    return DEFAULT_THEME;
  }

  try {
    const settings = await getOrCreateSettings();
    return settings.theme;
  } catch (error) {
    console.error('Error fetching theme from DB, using default theme:', error);
    return DEFAULT_THEME;
  }
}

export async function updateTheme(input: unknown): Promise<string> {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));
  }
  const result = await updateSettingsTheme(parsed.data);
  return result.theme;
}
