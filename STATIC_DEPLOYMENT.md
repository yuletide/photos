# Static Site Deployment Guide

This photos app has been converted from a server-side Next.js app to a fully static site that can be deployed to any static hosting service.

## Key Changes Made

### Removed Backend Dependencies
- **API Routes**: Deleted `/src/app/api/` - no longer needed
- **Runtime Dependencies**: Removed `@upstash/ratelimit`, `@upstash/redis` from production dependencies
- **Server Environment Variables**: No longer needed at runtime (only for build-time data generation)

### Added Static Site Features
- **Build-time Data Generation**: `scripts/generate-static-data.js` fetches all data from Flickr during build
- **Static Data Files**: Generated in `/src/data/` (gitignored, created during build)
- **Static HTML Pages**: All photoset detail pages pre-generated via `generateStaticParams`
- **Sample Data**: Included for development/demo without API keys

## Build Process

### With Flickr API Keys (Production)
```bash
# Set environment variables for data generation
export FLICKR_API_KEY="your_api_key"
export FLICKR_USER_ID="your_user_id"

# Build with real data from Flickr
npm run build
```

### Without API Keys (Development/Demo)
```bash
# Uses existing sample data
npm run build
```

The build process:
1. Runs `generate-data-if-env` to fetch Flickr data (if env vars exist)
2. Generates static HTML pages for all routes
3. Outputs to `/out/` directory ready for static hosting

## Configuration

### Gallery Configuration
Edit `/src/config/galleries.ts` to configure which Flickr photosets to include:

```typescript
export const galleryConfig: GalleryCategory[] = [
  {
    name: 'Travel',
    slug: 'travel',
    photosetIds: ['72157673637437610', '72177720327261716'],
  },
  // Add more categories...
];
```

### Next.js Static Export
The app is configured for static export in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'export',           // Enable static export
  trailingSlash: true,        // Better compatibility
  images: {
    unoptimized: true,        // Required for static export
  },
};
```

## Deployment Options

The `/out/` directory can be deployed to:

- **Vercel**: `npm run build` and deploy `/out/`
- **Netlify**: Set build command to `npm run build` and publish directory to `out`
- **GitHub Pages**: Copy `/out/` contents to gh-pages branch
- **AWS S3**: Upload `/out/` contents to S3 bucket with static website hosting
- **Any CDN/Static Host**: Upload `/out/` contents

## Data Generation Script

The `scripts/generate-static-data.js` script:
- Fetches photosets from Flickr API
- Filters by configured gallery categories
- Downloads photos for each photoset
- Saves as JSON files in `/src/data/`
- Respects Flickr API rate limits

## Development

### Local Development
```bash
npm run dev  # Uses sample data for hot-reload development
```

### Update Static Data
```bash
npm run generate-data  # Manually regenerate data from Flickr
```

### Test Static Build
```bash
npm run build
cd out && python3 -m http.server 8000
```

## File Structure

```
src/
├── app/
│   ├── sets/[id]/page.tsx     # Dynamic photoset pages
│   └── page.tsx               # Main gallery page
├── components/
│   ├── PhotoSetGrid.tsx       # Main photoset grid
│   └── PhotoSetDetail.tsx     # Individual photoset view
├── lib/
│   └── static-data.ts         # Static data utilities
├── data/ (generated)
│   ├── photosets.json         # All photosets
│   ├── photosets-travel.json  # Category-specific
│   └── photos/[id].json       # Photos for each set
└── config/
    └── galleries.ts           # Gallery configuration

scripts/
└── generate-static-data.js    # Build-time data generation

out/ (after build)
├── index.html                 # Main page
├── sets/[id]/index.html       # Photoset pages
└── _next/                     # Static assets
```

## Benefits

- ✅ **No Server Required**: Deploy anywhere that serves static files
- ✅ **Fast Loading**: Pre-generated pages load instantly
- ✅ **Cost Effective**: No server costs, just CDN/storage
- ✅ **Reliable**: No backend to go down
- ✅ **Scalable**: CDN can handle unlimited traffic
- ✅ **SEO Friendly**: All content is in HTML at build time