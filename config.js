/* Edit apiUrl after deploying the backend. Nothing secret belongs here —
   the SPA pulls Supabase/Stripe public keys from GET /api/public-config. */
window.FLOURISH_CONFIG = { apiUrl: "https://flourish-backend.onrender.com",
  /* Set ONLY after the IRS determination letter (docs/NONPROFIT.md). Until
     taxDeductible is true with a valid EIN, the app says gifts to Flourish
     are not tax-deductible. */
  nonprofit: { legalName: "", ein: "", taxDeductible: false } };
