# Information Security Policy (ISMS umbrella)

**Version 1.0 · Effective 2026-07-03 · Owner: Chris (Founder) · Review: annually or after material change**

## 1. Purpose & scope
Protect the confidentiality, integrity, and availability of Flourish user data — especially
sensitive pastoral data (prayer requests, counseling requests, private messages) — across the
Flourish PWA, its Supabase backend, Cloudflare/GitHub hosting, and Stripe payment links.

## 2. Roles
- **Owner/Admin (Chris):** accountable for this policy, vendor decisions, incident command, access grants.
- **Church leaders (pastor/church_admin):** data stewards for their congregation's data only; bound by
  in-app scoping (RLS) — they can never see another church's data.
- **Members:** control their own data (self-service export/erasure).

## 3. Access control (ISO A.5.15–A.5.18, A.8.2 · SOC 2 CC6 · HIPAA §164.312(a))
- Least privilege by default: anonymous users read only public data (public churches, public events);
  every other row is scoped by RLS to the owner, their church, or their leaders.
- Privileged operations run through SECURITY DEFINER functions that re-verify authorization server-side;
  privileged RPCs are not executable by the anonymous role.
- Leadership claims: first-claim allowed only when a church has no admin (server-enforced); later
  promotions require an existing leader.
- Admin surfaces (Supabase dashboard, Cloudflare, GitHub): unique accounts, strong passwords, MFA required
  (dashboard setting — see gap list), no shared credentials.
- Access reviews: quarterly — enumerate super_admins, church leaders, connected OAuth apps, deploy keys.

## 4. Cryptography (ISO A.8.24 · HIPAA §164.312(e))
TLS 1.2+ for all transport (HSTS on Cloudflare host). AES-256 at rest (Supabase/AWS managed).
Passwords: bcrypt via Supabase Auth. No application-managed keys except VAPID (push); private keys
must live in platform secret stores (gap tracked). No cryptography is hand-rolled.

## 5. Secure development & change management (ISO A.8.25–A.8.32 · SOC 2 CC8)
- All changes land via git commits on GitHub; production = `gh-pages` branch; deploys are reproducible
  (GitHub Pages automatic; Cloudflare via wrangler/Action).
- Database changes only via named migrations (Supabase migration history is the change log).
- Each release: syntax checks, in-app smoke test, RLS guard probes for new tables/functions,
  Supabase security advisors, and post-deploy live verification of both hosts.
- Service-worker cache version bumped every release (forces clean rollout).

## 6. Operations security (ISO A.8.15–A.8.16 · SOC 2 CC7 · HIPAA §164.312(b))
- Audit trail: DB triggers write to `audit_logs` (who/what/when + before/after images) for membership
  and role changes, church record changes, pastoral-request changes, group deletions, and account erasures.
  Super_admin read-only; 400-day retention, purged by scheduled job.
- Monitoring: Supabase logs + advisors; Cloudflare NEL reports; edge-function invocation logs.
- Scheduled jobs (pg_cron): daily push nudge 13:00 UTC; audit purge 13:30 UTC.

## 7. Vendor management (ISO A.5.19–A.5.23 · SOC 2 CC9)
Subprocessors are listed in risk-and-vendor-register.md with data categories and their own attestations
(Supabase: SOC 2 Type II; Cloudflare: ISO 27001/SOC 2; Stripe: PCI-DSS Level 1; GitHub: SOC 2).
New vendors require owner sign-off and a register entry before receiving data.

## 8. Data classification
- **Sensitive:** pastoral_only prayer/counseling requests, private messages → strictest RLS, leader-only, audited.
- **Personal:** profile, email, progress, memberships, giving records → owner + scoped leaders.
- **Community:** church_wide prayers, member rosters, group rosters → members of that church.
- **Public:** public church profiles, public events, curriculum content.

## 9. Acceptable use & workforce
Contributors get access only via GitHub collaboration; secrets are never committed (gitignore enforced,
history audited). Any workforce growth triggers: onboarding checklist, signed confidentiality
acknowledgment, and access-review inclusion.

## 10. Enforcement & exceptions
Exceptions require written owner approval with expiry. Violations by integrated churches
(e.g., leader misuse of member data) are grounds for leadership removal and, if warranted, church delisting.
