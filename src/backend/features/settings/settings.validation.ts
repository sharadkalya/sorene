import { z } from 'zod';
import { THEMES } from '@/common/themes';

export const themeSchema = z.enum(THEMES as [string, ...string[]]);

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
