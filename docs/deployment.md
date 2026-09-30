# Deployment

Hosted on Vercel (project `yuletides-projects/photos`). Pushing to `main`
deploys to production; other branches get preview deployments.

## Settings

- Node.js: 24.x (pinned via `engines` in `package.json`)
- Framework preset: Next.js, default build/output settings
- Environment variables: `FLICKR_API_KEY`, `FLICKR_USER_ID` (all environments)

No database or other services are required. Flickr responses are cached by
Next.js ISR for one hour (`REVALIDATE_SECONDS` in `src/lib/flickr.ts`).

## Custom domain

The domain can stay registered at IONOS; point its DNS at Vercel following
Vercel's domain configuration guide.
