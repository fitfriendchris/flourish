/* Edit apiUrl after deploying the backend. Nothing secret belongs here —
   the SPA pulls Supabase/Stripe public keys from GET /api/public-config. */
window.FLOURISH_CONFIG = { apiUrl: "https://rdnlorxsmyufaboftzus.supabase.co/functions/v1/flourish",
  /* The partner store (flourish-backend/data/catalog.json, storefront). */
  store: {"name": "TEN:EIGHTEEN", "url": "https://ten-eighteen.printify.me/", "tagline": "Luke 10:18. Faith apparel, printed to order.", "terms": "Sold, printed and shipped by TEN:EIGHTEEN through Printify. You choose a size, pay and arrange any return on the store's own site; Flourish takes no payment for these."},
  /* Set ONLY after the IRS determination letter (docs/NONPROFIT.md). Until
     taxDeductible is true with a valid EIN, the app says gifts to Flourish
     are not tax-deductible. */
  nonprofit: { legalName: "", ein: "", taxDeductible: false } };
