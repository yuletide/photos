# Photos

A minimal photo gallery that pulls albums straight from Flickr.

## How it works

- Pages are Server Components that call the Flickr REST API with `fetch`
  (`src/lib/flickr.ts`). No API routes, no client-side data fetching.
- Every page is prerendered at build time and regenerated in the background
  at most once an hour (ISR). New photos added to an existing Flickr album
  show up automatically with no redeploy needed.
- Which albums appear, and in which category, is controlled by
  `src/config/galleries.ts`. Adding a new album or category there requires a
  deploy (just push to `main`).
- Images load directly from Flickr's CDN (`live.staticflickr.com`).

Routes: `/` (all configured albums), `/category/[slug]`, `/sets/[id]`.

## Development

Requires Node 24 (see `.node-version`).

```bash
vercel env pull .env.local   # or create it with FLICKR_API_KEY + FLICKR_USER_ID
npm install
npm run dev
```

`npm test` runs the Vitest suite; `npm run lint` runs ESLint.

## Environment variables

| Name             | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `FLICKR_API_KEY` | Flickr API key (server-only; never shipped to the browser) |
| `FLICKR_USER_ID` | Flickr NSID of the account, e.g. `24273822@N00`            |

Both are needed at build time and at runtime (for revalidation).
