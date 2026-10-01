import { getExif } from '@/lib/flickr';
import { isPublishedPhoto } from '@/lib/published';

// EXIF for the lightbox info panel, fetched when a viewer opens it rather than
// for every photo at build time. Successful answers are cached at the CDN for
// a month (EXIF doesn't change); misses briefly, so turning EXIF back on in
// Flickr's privacy settings shows up quickly.
const CACHE_HIT = 'public, s-maxage=2592000, stale-while-revalidate=86400';
const CACHE_MISS = 'public, s-maxage=300';

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  // Only proxy EXIF for photos on this site, so the API key can't be used to
  // look up arbitrary Flickr photos.
  let published: boolean;
  try {
    published = /^\d+$/.test(id) && (await isPublishedPhoto(id));
  } catch {
    return Response.json(null, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (!published) {
    return Response.json(null, {
      status: 404,
      headers: { 'Cache-Control': CACHE_MISS },
    });
  }

  const exif = await getExif(id);
  return Response.json(exif ?? null, {
    headers: { 'Cache-Control': exif ? CACHE_HIT : CACHE_MISS },
  });
};
