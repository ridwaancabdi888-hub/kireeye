# Kireeye

**Gaadhiga saxda ah, goob kasta, goor kasta.**

Kireeye is a multilingual vehicle-rental marketplace designed for Somaliland and Somalia. It supports customers, individual car owners, rental companies, company employees, platform admins and a super admin.

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
