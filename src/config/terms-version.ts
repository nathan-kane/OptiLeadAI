// Terms and Conditions version configuration
// Update this when terms are modified to track user consent versions

export const TERMS_CONFIG = {
  version: '1.0',
  effectiveDate: '8/25/2025',
  lastUpdated: '2025-08-27'
} as const;

export type TermsVersion = typeof TERMS_CONFIG.version;
