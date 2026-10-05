import { FLICKR_IMAGES } from '@/lib/flickr';

// Flickr's image CDN refuses requests that come through iCloud Private Relay
// (503s in Safari), so photos are served from this site's own domain instead:
// /flickr/<server>/<id>_<secret>[_<size>].jpg fetches that file from Flickr.
// A Flickr image URL never changes once published, so each one is cached at
// Vercel's CDN (and in browsers) for a year and fetched from Flickr about once.
const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

// Only Flickr photo files, so this can't be used to proxy anything else.
const PHOTO_PATH = /^\d+\/\d+_[0-9a-f]+(_[a-z0-9]+)?\.(jpg|png)$/;

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) => {
  const path = (await params).path.join('/');
  if (!PHOTO_PATH.test(path)) {
    return new Response(null, { status: 404 });
  }

  // Images can be several MB: stream them through, don't keep them in
  // Next's data cache (the CDN caches the response instead).
  const upstream = await fetch(FLICKR_IMAGES + path, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) {
    return new Response(null, {
      status: upstream.status === 404 ? 404 : 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': CACHE,
    },
  });
};
