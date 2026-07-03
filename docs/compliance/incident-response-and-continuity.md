# Incident Response Plan & Business Continuity

**Version 1.0 · Effective 2026-07-03 · Incident Commander: Chris (fitfriendchris@gmail.com)**

## 1. What counts as an incident
Unauthorized data access/disclosure (esp. pastoral_only requests or messages), account takeover,
defacement or malicious deploy, payment-flow abuse, credential/key leak, prolonged outage (>4h),
vulnerability report via security.txt.

## 2. Severity
- **SEV1:** confirmed exposure of sensitive pastoral data or credentials; malicious code deployed.
- **SEV2:** suspected unauthorized access; auth bypass; giving/store flow abuse.
- **SEV3:** outage without data exposure; vulnerability reported but unexploited.

## 3. Response runbook
1. **Contain (first hour)**
   - Malicious deploy: `git revert` + push `gh-pages`; redeploy Cloudflare (`npx wrangler pages deploy`).
     Both hosts serve from the same branch — one revert fixes both.
   - Compromised DB path: Supabase dashboard → pause project (kills all API access instantly);
     or revoke/rotate the exposed key.
   - Compromised admin account: rotate password + sessions (Supabase Auth → sign out user), rotate
     GitHub/Cloudflare tokens.
   - Push abuse: delete `daily-nudge` function or unschedule the cron job.
2. **Assess:** query `audit_logs` (who/what/when, before/after images); Supabase auth logs and API logs;
   Cloudflare analytics; edge-function logs. Preserve exports before any cleanup.
3. **Eradicate/recover:** patch the vector via migration/commit; restore data from backups (see §5);
   re-run security advisors; verify both hosts byte-identical.
4. **Notify:** affected users within 72h with plain facts (what, when, what data, what we did, what they should do).
   If churches' member data was involved, notify those church leaders directly. Post-incident note kept in this folder.
5. **Post-mortem (within 1 week):** timeline, root cause, control that failed, control added. Append below.

## 4. Vulnerability disclosures
`/.well-known/security.txt` → fitfriendchris@gmail.com. Acknowledge within 72h. No legal threats against
good-faith research. Fix target: SEV1 72h, SEV2 2 weeks, SEV3 next release.

## 5. Backup & continuity
- **Code + content data (curriculum/plans):** fully version-controlled on GitHub; every historical
  state recoverable; two independent hosts (GitHub Pages + Cloudflare Pages) serve the same branch —
  either surviving is sufficient for read access.
- **Database:** Supabase daily backups require Pro plan — **tracked gap, priority 1**. Until then,
  a manual export path exists (see backup script note in repo README/ops). Recovery objective once
  Pro is active: RPO 24h, RTO ~1h.
- **Auth outage / DB pause:** app degrades gracefully to guest mode (devotionals + plans fully
  functional offline via service worker); church features return when backend resumes.
- **Key personnel:** bus factor is 1 (owner). Mitigation tracked: document a break-glass procedure
  and add a second maintainer.

## 6. Post-mortems
_None yet. Append entries here: date, severity, summary, root cause, actions._
