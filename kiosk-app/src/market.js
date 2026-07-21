// Build-time market selector. VITE_MARKET is set by .env.embed-uki (or a
// Vercel env var); absent means the original US build. The kiosk/touchscreen
// build is always US.
export const MARKET = import.meta.env.VITE_MARKET || 'us';
export const UKI = MARKET === 'uki';
