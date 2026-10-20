/**
 * daisyui v5 ships no TypeScript declarations, so we provide a minimal ambient
 * declaration matching how the plugin is used in `tailwind.config.ts`.
 */
declare module 'daisyui' {
  import type { Config } from 'tailwindcss';

  const plugin: NonNullable<Config['plugins']>[number];
  export default plugin;
}
