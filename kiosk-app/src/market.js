// Build-time market selector. VITE_MARKET is set by .env.embed-uki,
// .env.kiosk-uki or .env.embed-au (or a Vercel env var); absent means the
// original US build. Surface (touchscreen vs embed) is chosen separately by
// VITE_EMBED, so UKI ships as both an embed and a touchscreen kiosk.
export const MARKET = import.meta.env.VITE_MARKET || 'us';
export const UKI = MARKET === 'uki';
export const AU = MARKET === 'au';
