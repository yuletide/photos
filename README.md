# Photos

A minimal photo gallery that pulls albums straight from Flickr.

## How it works

- Pages are Server Components that call the Flickr REST API with `fetch`
  (`src/lib/flickr.ts`). The one exception is EXIF for the lightbox info
  panel, which is fetched on demand from `/api/photos/[id]/exif` when a viewer
  opens it (one Flickr call per photo, cached at the CDN), rather than for
  every photo at build time.
- Every page is prerendered at build time and regenerated in the background
  at most once an hour (ISR). New photos added to an existing Flickr album
  show up automatically with no redeploy needed.
- Which photos appear, and in which category, is controlled by
  `src/config/galleries.ts` (see [Categories](#categories)).
- Images load directly from Flickr's CDN (`live.staticflickr.com`).

Routes: `/` (all configured albums), `/category/[slug]`, `/sets/[id]`.

## Categories

Each category in `src/config/galleries.ts` becomes a link in the nav and a
page at `/category/[slug]`. A category can pull photos from Flickr in two
ways, and can use both:

- **Albums** (`photosetIds`): a list of Flickr album IDs, shown as album
  tiles that open `/sets/[id]`. Good for trips or shows that belong together.
- **Tags** (`tags`): every public photo tagged with _all_ of these Flickr
  tags, newest first, shown directly as a photo grid below any albums. Good
  for themes that cut across albums, or sets too small to deserve an album.

```ts
{
  name: 'Travel',
  slug: 'travel',
  photosetIds: ['72157673637437610'], // from flickr.com/photos/<you>/albums/<id>
},
{
  name: 'Botanical',
  slug: 'botanical',
  photosetIds: [],
  tags: ['botanical', 'gallery'], // photos need both tags
},
```

The `gallery` tag is a curation flag: pairing it with a subject tag means
only photos you've picked show up, not everything you've ever tagged
`botanical`.

Broad categories work well with a Lightroom keyword hierarchy: put
`Flowers` and `Dead plants` under a `Botanical` parent. In Keyword List →
right-click → Edit Keyword Tag, turn on **Export Containing Keywords** for
each child (`Flowers`, `Dead plants`) and keep **Include on Export** on for
`Botanical` (both are on by default for new keywords). A photo keyworded
`Dead plants` then reaches Flickr tagged both `deadplants` and `botanical`;
the Keywording panel's **Will Export** view shows what will be sent.

### Adding photos from Lightroom Classic

- **Tag-based categories:** add the keywords (e.g. `botanical` and `gallery`)
  and publish or re-publish to Flickr through the Flickr publish service.
  Lightroom keywords become Flickr tags. After the one-hour cache expires, a
  request starts a background refresh; requests after it completes see the photo.
- **Album categories:** publish into a Photoset collection under the Flickr
  publish service. New photos in an already-configured album appear within the
  hour.

No deploy is needed for either. A deploy (push to `main`) is only needed to
add a new category or a new album ID to the config.

Things to know:

- Only **public** photos show up.
- Flickr normalizes tags to lowercase without spaces, so the Lightroom keyword
  `Flowers` matches `flowers`, and `Mt Tam` becomes `mttam`. Tags must match
  exactly otherwise: `flower` won't match `flowers`.
- Lightroom's Flickr publish settings must include keywords in the exported
  metadata ("Copyright only" drops them).

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
