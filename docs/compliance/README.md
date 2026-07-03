# Flourish — Compliance Posture

**Last reviewed:** 2026-07-03 · **Owner:** Chris (fitfriendchris@gmail.com)

## Honest status

Flourish implements the **technical and documented controls** aligned with ISO 27001, SOC 2, and
HIPAA safeguards. It is **not certified** against any of them — certification is an organizational
process no codebase can grant itself:

| Framework | What it actually is | Status | Path to the real thing |
|---|---|---|---|
| **ISO 27001** | Certification of an org's Information Security Management System by an accredited body | Controls implemented + policies documented (this folder) | Adopt these policies formally → run the risk process quarterly → engage a certification body (Stage 1+2 audits, typically $8–25k, 3–6 months) |
| **SOC 2** | CPA-firm attestation (Type I: point-in-time; Type II: 3–12 month observation) against the Trust Services Criteria | Controls implemented + mapped (see control-mapping.md) | Adopt a compliance platform (Vanta/Drata, ~$5–15k/yr) → collect evidence 3+ months → engage an audit firm ($10–30k) |
| **HIPAA** | US law applying to covered entities & business associates handling PHI | **Likely not applicable** — Flourish is not a covered entity or business associate. Safeguards implemented as best practice for sensitive pastoral data | Only needed if partnering with healthcare providers. Would require: BAAs with every vendor (Supabase BAA = Team plan $599/mo; Cloudflare Enterprise), workforce training, breach-notification procedures |

## What IS implemented (evidence)

- **Access control:** Row-Level Security on 100% of public tables (31/31); role-based leadership
  (member/deacon/pastor/church_admin/super_admin); privileged RPCs restricted to `authenticated`,
  with server-side guards re-checked inside every SECURITY DEFINER function.
- **Encryption:** TLS on all traffic (HSTS enforced on Cloudflare host); AES-256 at rest (Supabase/AWS);
  passwords bcrypt-hashed by Supabase Auth (never stored by the app).
- **Audit logging:** `audit_logs` table populated by database triggers on security-relevant tables
  (memberships/roles, church records, pastoral requests, groups) + erasure requests; readable only by
  super_admin; 400-day retention with automated purge.
- **Data rights:** self-service export (JSON, instant) and self-service erasure (cascading delete,
  audit-logged, E2E tested) in Me → Account. See privacy.html.
- **Vulnerability management:** Supabase security advisors reviewed each release; `/.well-known/security.txt`
  published for responsible disclosure; dependencies minimal by design (no build chain = tiny supply-chain surface).
- **Payment security:** all card handling delegated to Stripe-hosted checkout (SAQ-A posture);
  card data never touches Flourish infrastructure.
- **Headers/CSP:** CSP on all pages; HSTS, nosniff, referrer-policy, frame-denial (embed exempted by design)
  on the Cloudflare host.

## Gaps to close before an audit (tracked)

1. Supabase **Pro/Team plan**: scheduled backups + PITR (currently the largest availability gap: free tier auto-pauses).
2. Dashboard toggles: leaked-password protection (HIBP), MFA enforcement for leader/admin accounts.
3. Move VAPID push keys from edge-function source to Supabase secrets.
4. Formal quarterly access review + risk review calendar (template in risk-and-vendor-register.md).
5. A second maintainer / break-glass account documented (bus factor = 1 today).
