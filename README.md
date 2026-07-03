# Flourish — Biblical Life Mastery

> *"By wisdom a house is built, and by understanding it is established."* — Proverbs 24:3

A 3-year journey of biblical life mastery across **Health, Wealth, and Relationships** — with your church community built in.

## Live App
- **Cloudflare (primary — hardened security headers):** https://flourish-8ql.pages.dev
- **GitHub Pages (mirror):** https://fitfriendchris.github.io/flourish

Both serve the same code from the `gh-pages` branch. Deploy to Cloudflare with
`npx wrangler pages deploy . --project-name flourish --branch gh-pages` after pushing.

## What's Inside (v10)
- **3-Year Devotional** — 1,095 days across three arcs:
  - Year 1 · *Foundation* — identity, disciplines, first principles
  - Year 2 · *Deepening* — testing, healing, multiplication
  - Year 3 · *Multiplication* — legacy, eldership, sending
  - Men's & women's tracks, scripture, life application, enrichment (historical context, word studies, Christ connections, reflection)
- **9 Guided Plans** — focused sprints inside each pillar (21-Day Temple Reset, 30-Day Debt Freedom Sprint, 21-Day Marriage Renewal, and more)
- **Church Hub** — real multi-church support backed by Supabase:
  - Church directory + QR/link invites; register or claim your church
  - Members area with cross-device progress sync
  - Community events with RSVPs
  - Private messaging to church leaders
  - Requests (prayer / counseling / benevolence / visits) with leader inbox
  - **Church Plan Dashboard** for leaders — member devotional engagement, requests, events at a glance
- **Offline-first PWA** — guest mode works fully offline; sign in to sync and join your church

## Architecture
- **Frontend:** vanilla JS PWA (no build step) on GitHub Pages
- **Backend:** Supabase (Postgres + Auth + RLS) — schema in `~/Flourish/docs/schema.sql`
- **Content pipeline:** `~/Flourish/generate_years23.py` (years 2–3), `generate_365.py` (year 1)

## The Promise
Do the lessons. Apply the wisdom. Everything governed by biblical principles —
health, money, and relationships — gets better by design, not by accident.
Hear → Do → Flourish. (Matthew 7:24, Psalm 1:2-3, Hebrews 12:11)
