# Kireeye

**Gaadhiga saxda ah, goob kasta, goor kasta.**

Kireeye is a multilingual vehicle-rental marketplace designed for Somaliland and Somalia. It supports customers, individual car owners, rental companies, company employees, platform admins and a super admin.

Production: https://kireeye-x2oq-ruddy.vercel.app/

## Current foundation

- Next.js 15 + TypeScript
- Responsive marketplace homepage
- Vehicle listing page
- Super Admin dashboard prototype
- Company dashboard prototype
- Customer dashboard prototype
- Supabase starter schema
- Somali-first branding and local city/airport support
- PWA-ready architecture

## Prerequisites

- Node.js 20 or newer
- npm

## Run locally

### macOS, Linux, or Git Bash

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Windows PowerShell

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Available scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — run the production server after building
- `npm run typecheck` — check TypeScript types without emitting files
- `npm run check` — run the type check and production build together

## Key routes

- `/` marketplace homepage
- `/vehicles` vehicle search results
- `/customer` customer dashboard
- `/company` company dashboard
- `/admin` super admin dashboard

## Environment variables

See `.env.example`. Never commit `.env.local` or real credentials.

## Contact

- WhatsApp: +252 63 4199277
- Email: ridwaancabdi888@gmail.com

## Search visibility setup

Canonical website: `https://kireeye-x2oq-ruddy.vercel.app/`

- Sitemap: `https://kireeye-x2oq-ruddy.vercel.app/sitemap.xml`
- Robots file: `https://kireeye-x2oq-ruddy.vercel.app/robots.txt`
- Public marketplace routes are included in the sitemap; dashboard, authentication, booking, support, callback, and API routes are excluded from indexing.
- Approved database vehicle records can be added to the sitemap dynamically. Demo inventory is never substituted when Supabase is unavailable or empty.

To connect Google Search Console:

1. Add the canonical production URL as a URL-prefix property.
2. Verify ownership. For HTML-tag verification, add Google's verification value to the metadata in `app/layout.tsx`, deploy, and complete verification in Search Console.
3. Submit `sitemap.xml` in the **Sitemaps** report.
4. Inspect the homepage and `/vehicles`, run a live test, and request indexing after deployment verification.
5. Monitor Page Indexing and Core Web Vitals; do not request indexing for private dashboards, auth, checkout, or API URLs.

Search Console ownership remains a manual owner action. The Privacy Policy, Terms, and Cancellation Policy are explicitly marked as templates and require review against the live product, verified provider rules, retention practices, and local law before official launch. For local visibility, create or verify a Google Business Profile only after the business name, service area, phone, and operating details are final; keep the verified phone and website URL consistent.
