# Control Mapping — ISO 27001:2022 Annex A · SOC 2 TSC · HIPAA Security Rule

Status: ✅ implemented · 🟡 partial/tracked gap · ⬜ not applicable at current scale
Evidence column names the artifact an auditor would inspect.

| Control area | ISO 27001 | SOC 2 | HIPAA | Status | Implementation / evidence |
|---|---|---|---|---|---|
| Security policies | A.5.1 | CC1.x | §164.316 | ✅ | This folder (adopted 2026-07-03) |
| Roles & responsibilities | A.5.2 | CC1.3 | §164.308(a)(2) | ✅ | information-security-policy §2; app_role enum + RLS |
| Access control / least privilege | A.5.15, A.8.2 | CC6.1–6.3 | §164.312(a)(1) | ✅ | RLS on 31/31 tables; anon lockout on privileged RPCs; server-side guards in every SECURITY DEFINER fn |
| Authentication | A.5.16–5.17 | CC6.1 | §164.312(d) | 🟡 | Supabase Auth (bcrypt, email verify, reset). Gap: HIBP leaked-password toggle + MFA enforcement for leaders (dashboard) |
| Access reviews | A.5.18 | CC6.2 | §164.308(a)(4) | 🟡 | Quarterly review defined; first review due 2026-10-01 |
| Cryptography in transit | A.8.24 | CC6.7 | §164.312(e) | ✅ | TLS everywhere; HSTS (Cloudflare host); CSP restricts origins |
| Cryptography at rest | A.8.24 | CC6.7 | §164.312(a)(2)(iv) | ✅ | Supabase/AWS AES-256 (vendor attestation) |
| Logging & monitoring | A.8.15–8.16 | CC7.2 | §164.312(b) | ✅ | audit_logs triggers (memberships, churches, prayers, groups, erasures); super_admin-only read; Supabase/CF logs |
| Log retention & protection | A.8.15 | CC7.2 | §164.316(b)(2) | ✅ | 400-day retention, automated purge; logs immutable to non-admins |
| Change management | A.8.32 | CC8.1 | §164.308(a)(8) | ✅ | Git history; named DB migrations; release checklist incl. advisors + post-deploy verification |
| Secure development | A.8.25–8.28 | CC8.1 | — | ✅ | XSS-safe rendering (esc() everywhere), CSP, no eval, minimal deps, no build chain |
| Vulnerability management | A.8.8 | CC7.1 | §164.308(a)(1) | ✅ | Supabase advisors each release; security.txt disclosure channel; fix SLAs in IR plan |
| Backup | A.8.13 | A1.2 | §164.308(a)(7) | 🟡 | Code/content: full git redundancy + dual hosts. DB: requires Supabase Pro — **top gap** |
| Availability / DR | A.8.14 | A1.2–1.3 | §164.308(a)(7) | 🟡 | Dual-host frontend; offline-first PWA degrades gracefully; DB single-region (acceptable at scale) |
| Vendor management | A.5.19–5.23 | CC9.2 | §164.308(b) | ✅ | risk-and-vendor-register.md; all subprocessors hold SOC 2/ISO/PCI attestations |
| Data classification | A.5.12 | C1.1 | §164.308(a)(1) | ✅ | 4-tier scheme (info-sec policy §8) enforced by RLS design |
| Data minimization | A.5.34 | P (privacy) | §164.514 | ✅ | No analytics/trackers; guest mode fully local; push stores endpoint only; erasure audit stores email domain only |
| Right of access / portability | — | P6.x | §164.524 | ✅ | Self-service JSON export (Me → Account), instant |
| Right to erasure | A.8.10 | P4.x | §164.526 | ✅ | Self-service cascade deletion via edge function; E2E tested 2026-07-03; audit-logged |
| Retention & disposal | A.8.10 | P4.2 | §164.310(d)(2) | ✅ | data-lifecycle policy in privacy.html §6a; automated purges |
| Incident response | A.5.24–5.28 | CC7.3–7.5 | §164.308(a)(6) | ✅ | incident-response-and-continuity.md; 72h notification commitment |
| Breach notification | — | CC7.4 | §164.400+ | ✅ | IR plan §3.4 (72h, plain-language, church-leader channel) |
| Physical security | A.7.x | CC6.4 | §164.310 | ⬜ | No physical infrastructure — inherited from AWS/Cloudflare/GitHub (their attestations apply) |
| Workforce security/training | A.6.x | CC1.4 | §164.308(a)(3),(5) | 🟡 | Solo operator today; onboarding checklist defined for first hire |
| BAAs (HIPAA-specific) | — | — | §164.308(b) | ⬜ | Not a covered entity/BA. If that changes: Supabase Team BAA + vendor BAAs required first |
| PCI (payments) | — | — | — | ✅ | SAQ-A posture: Stripe-hosted payment links only; card data never touches Flourish |

## Release checklist (the control that keeps this table true)
1. `node --check` all JS; JSON validation for data files
2. New tables/functions: RLS policies + anon guard probes against the live API
3. Supabase security advisors — zero unaccepted findings
4. In-app smoke (no console errors) before push
5. Push `gh-pages` → verify BOTH hosts serve the new version (parity check)
6. Bump SW cache version; migrations named and immutable
