# SecureVibe

SecureVibe is a Next.js SaaS MVP for security analysis and remediation of AI-built applications.

## MVP flow

GitHub or ZIP input → evidence-backed scan → security score → finding explanation → patch and security test → re-audit.

## First milestone

The initial engine implements R09 Open Redirect detection with exact file/line reporting, safe redirect remediation helper, tests, and a demo Next.js dashboard/API.

## Frontend build note

The MVP intentionally uses plain CSS in `apps/web/app/globals.css` instead of Tailwind/PostCSS. This keeps Vercel builds deterministic while the product foundation is still small and avoids Tailwind v4 PostCSS plugin mismatches.

## Commands

```bash
npm install
npm test
npm run build
```
