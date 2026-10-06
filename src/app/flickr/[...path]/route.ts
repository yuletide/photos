import { FLICKR_IMAGES } from '@/lib/flickr';
import { isPublishedPhoto } from '@/lib/published';

// Flickr's image CDN refuses requests that come through iCloud Private Relay
// (503s in Safari), so photos are served from this site's own domain instead:
// /flickr/<server>/<id>_<secret>[_<size>].jpg fetches that file from Flickr.
//
// Caching: a replaced or rotated photo gets a new secret, so a new URL, and
// the hourly-refreshed pages switch to it. What a long cache would keep alive
// is a photo taken off the site, so cache for a day. Each response is tagged
// so one photo (flickr-<id>) or all (flickr) can be purged right away:
//   vercel cache dangerously-delete --tag flickr-<photo id>
const CACHE = 'public, max-age=86400';
const CDN_CACHE = 'max-age=86400';
const MISS = 'public, s-maxage=300';

// Only Flickr photo files: <server>/<id>_<secret>[_<size>].jpg|png
const PHOTO_PATH = /^\d+\/(\d+)_[0-9a-f]+(?:_[a-z0-9]+)?\.(?:jpg|png)$/;

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) => {
  const path = (await params).path.join('/');
  const id = PHOTO_PATH.exec(path)?.[1];
  if (!id) return new Response(null, { status: 404 });

  // Only photos published on this site, so it can't serve anyone else's
  // Flickr photos, or one that has since been taken off the site.
  let published: boolean;
  try {
    published = await isPublishedPhoto(id);
  } catch {
    return new Response(null, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (!published) {
    return new Response(null, {
      status: 404,
      headers: { 'Cache-Control': MISS },
    });
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
      'Vercel-CDN-Cache-Control': CDN_CACHE,
      'Vercel-Cache-Tag': `flickr-${id},flickr`,
    },
  });
};
