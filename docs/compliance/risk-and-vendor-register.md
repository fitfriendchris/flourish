# Risk Register & Vendor (Subprocessor) Register

**Version 1.0 · 2026-07-03 · Review quarterly (next: 2026-10-01)**

## Risk register
Scoring: Likelihood × Impact, 1–5 each. Treat ≥12 first.

| # | Risk | L | I | Score | Treatment | Status |
|---|---|---|---|---|---|---|
| R1 | Supabase free-tier auto-pause takes church hub down | 5 | 3 | 15 | Upgrade to Pro (removes pause + adds backups) | **Open — top priority** |
| R2 | No DB backups until Pro plan | 2 | 5 | 10 | Same as R1; interim manual export | Open |
| R3 | Bus factor = 1 (single operator/admin) | 3 | 4 | 12 | Document break-glass; add second maintainer | Open |
| R4 | Leader account takeover exposes pastoral data of that church | 2 | 5 | 10 | MFA for leaders (dashboard toggle); HIBP passwords; audit trail detects | Mitigating |
| R5 | VAPID private key embedded in edge-function source | 2 | 2 | 4 | Moved to Supabase project secrets; function redeployed + tested | **Closed 2026-07-03** |
| R6 | Malicious/compromised deploy via GitHub account | 2 | 4 | 8 | GitHub 2FA; instant revert runbook (IR §3.1); dual-host isolation | Mitigating |
| R7 | Church leader misuses member data (insider) | 2 | 4 | 8 | Per-church isolation caps blast radius; audit_logs; delisting policy | Accepted w/ controls |
| R8 | XSS via user content | 1 | 4 | 4 | esc() on all render paths + CSP; checked each release | Controlled |
| R9 | Push notification spam if function abused | 1 | 2 | 2 | verify_jwt on function; cron-only invocation pattern | Controlled |
| R10 | Nominatim/CDN third-party outage degrades features | 2 | 1 | 2 | Graceful degradation built in | Accepted |

## Vendor register (subprocessors)

| Vendor | Purpose | Data categories | Region | Their attestations | Agreement |
|---|---|---|---|---|---|
| Supabase (AWS us-east-1) | Database, auth, edge functions | All account + community data | US | SOC 2 Type II, HIPAA-ready (Team+) | ToS/DPA |
| Cloudflare Pages | Primary hosting, headers, CDN | Static assets only (no user data at rest) | Global edge | ISO 27001, SOC 2 | ToS |
| GitHub (Microsoft) | Code, CI, mirror hosting | Source + static assets | US | SOC 2 | ToS |
| Stripe | Payments (hosted checkout links) | Payment card data (never touches Flourish) | US | PCI-DSS Level 1, SOC 2 | ToS |
| Google Fonts / jsDelivr | Fonts, supabase-js CDN | None (asset delivery) | Global | — | ToS |
| OpenStreetMap Nominatim | One-time address geocoding (leader action) | Church address (public data) | EU | — | Usage policy |
| Apple/Google/Mozilla push services | Web-push delivery | Opaque endpoint tokens only | Global | — | Platform terms |

## Quarterly review checklist
- [ ] Enumerate super_admins + church leaders; confirm each still legitimate
- [ ] Review GitHub/Cloudflare/Supabase account access + tokens; rotate stale ones
- [ ] Re-run Supabase security advisors; triage anything new
- [ ] Sample audit_logs for anomalies (role changes, mass deletions)
- [ ] Re-score this register; update treatments
