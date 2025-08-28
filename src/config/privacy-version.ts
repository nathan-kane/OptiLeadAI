// Privacy Policy version configuration
// Update this when privacy policy is modified to track user consent versions

export const PRIVACY_CONFIG = {
  version: '1.0',
  effectiveDate: '8/25/2025',
  lastUpdated: '2025-08-27'
} as const;

export type PrivacyVersion = typeof PRIVACY_CONFIG.version;
