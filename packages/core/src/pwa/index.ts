// Explicit .ts extensions: this module is the only @pwarush/core entry consumed
// at build-time (from each app's vite.config.ts), where Node loads it directly
// via type stripping and requires extensioned relative specifiers.
export type { PwaAppConfig } from './createPwaConfig.ts';
export { createPwaConfig } from './createPwaConfig.ts';
export { createVersionJsonPlugin } from './createVersionJsonPlugin.ts';
