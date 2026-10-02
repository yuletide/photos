import {
  FlickrExifResponse,
  FlickrPhoto,
  FlickrPhotoset,
  FlickrPhotosetPhotosResponse,
  FlickrPhotosetsResponse,
  FlickrPhotosSearchResponse,
  PhotoExif,
} from '@/types/flickr';

const API_URL = 'https://api.flickr.com/services/rest/';

// How often (seconds) cached Flickr responses are refreshed. Pages built from
// this data are regenerated in the background via ISR - no redeploy needed.
export const REVALIDATE_SECONDS = 3600;

const getCredentials = () => {
  const apiKey = process.env.FLICKR_API_KEY;
  const userId = process.env.FLICKR_USER_ID;
  if (!apiKey || !userId) {
    throw new Error(
      'FLICKR_API_KEY and FLICKR_USER_ID must be set in the environment.',
    );
  }
  return { apiKey, userId };
};

const callFlickr = async <T>(
  method: string,
  params: Record<string, string>,
  init: RequestInit = { next: { revalidate: REVALIDATE_SECONDS } },
): Promise<T> => {
  const { apiKey, userId } = getCredentials();
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    method,
    api_key: apiKey,
    user_id: userId,
    format: 'json',
    nojsoncallback: '1',
    ...params,
  }).toString();

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Flickr ${method} failed with HTTP ${res.status}`);
  }

  // Flickr returns HTTP 200 with stat "fail" for API-level errors.
  const body = await res.json();
  if (body.stat !== 'ok') {
    throw new Error(`Flickr ${method} failed: ${body.message ?? 'unknown'}`);
  }
  return body as T;
};

// Flickr caps per_page at 500, so walk every page until `pages` is reached.
const PER_PAGE = 500;

// Grid thumbnails (m), the larger sizes the lightbox picks from, and the
// details shown in its info panel (EXIF is fetched separately, on demand).
const PHOTO_EXTRAS = 'url_m,url_l,url_h,url_k,tags,date_taken';

const fetchAllPages = async <T>(
  fetchPage: (page: number) => Promise<{ items: T[]; pages: number }>,
): Promise<T[]> => {
  const first = await fetchPage(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, Number(first.pages) - 1) }, (_, i) =>
      fetchPage(i + 2),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
};

export const getPhotosets = async (): Promise<FlickrPhotoset[]> =>
  fetchAllPages(async (page) => {
    const res = await callFlickr<FlickrPhotosetsResponse>(
      'flickr.photosets.getList',
      {
        page: String(page),
        per_page: String(PER_PAGE),
        primary_photo_extras: 'url_m,url_l',
      },
    );
    return { items: res.photosets.photoset, pages: res.photosets.pages };
  });

export const getPhotoset = async (
  photosetId: string,
): Promise<{ title: string; photos: FlickrPhoto[] }> => {
  let title = '';
  const photos = await fetchAllPages(async (page) => {
    const res = await callFlickr<FlickrPhotosetPhotosResponse>(
      'flickr.photosets.getPhotos',
      {
        photoset_id: photosetId,
        page: String(page),
        per_page: String(PER_PAGE),
        extras: PHOTO_EXTRAS,
      },
    );
    title = res.photoset.title;
    return { items: res.photoset.photo, pages: res.photoset.pages };
  });
  return { title, photos };
};

// Public photos carrying every one of `tags`, newest first.
export const getPhotosByTags = async (tags: string[]): Promise<FlickrPhoto[]> =>
  fetchAllPages(async (page) => {
    const res = await callFlickr<FlickrPhotosSearchResponse>(
      'flickr.photos.search',
      {
        tags: tags.join(','),
        tag_mode: 'all',
        sort: 'date-taken-desc',
        page: String(page),
        per_page: String(PER_PAGE),
        extras: PHOTO_EXTRAS,
      },
    );
    return { items: res.photos.photo, pages: res.photos.pages };
  });

// Fields read from flickr.photos.getExif, keyed by Flickr's tag name. The
// first tag present wins.
const EXIF_FIELDS: Record<Exclude<keyof PhotoExif, 'camera'>, string[]> = {
  lens: ['LensModel', 'Lens'],
  exposureTime: ['ExposureTime'],
  aperture: ['FNumber'],
  iso: ['ISO'],
  focalLength: ['FocalLength'],
  exposureBias: ['ExposureCompensation'],
};

// Flickr's raw EXIF values are usually bare ("1/160", "4.5", "25.0 mm"),
// but cameras and Flickr's own formatting vary ("0.006 sec (1/160)",
// "f/4.5", "-0.7 EV"), so each formatter normalizes before decorating.
// An empty result means "don't show".

// "25.0" -> "25", "17.0-50.0 mm" -> "17-50 mm"
const trimZeros = (value: string) => value.replace(/(\d+)\.0\b/g, '$1');

const parseNumber = (value: string) => {
  const fraction = value.match(/^([+-]?)(\d+)\/(\d+)$/);
  return fraction
    ? Number(`${fraction[1]}1`) * (Number(fraction[2]) / Number(fraction[3]))
    : Number(value);
};

// Exposure compensation in thirds of a stop: -0.7 -> "-2/3", -1.3 -> "-1 1/3".
const formatStops = (value: number) => {
  const thirds = Math.round(Math.abs(value) * 3);
  const whole = Math.floor(thirds / 3);
  const rest = thirds % 3 ? `${thirds % 3}/3` : '';
  const sign = value < 0 ? '-' : '+';
  return `${sign}${[whole || '', rest].filter(Boolean).join(' ')}`;
};

const formatExif: Record<keyof typeof EXIF_FIELDS, (raw: string) => string> = {
  lens: (raw) => trimZeros(raw.trim()),
  exposureTime: (raw) => {
    // "0.006 sec (1/160)" -> "1/160"; "1/160", "1/160 s", "20" pass through.
    const value = (raw.match(/\(([^)]+)\)/)?.[1] ?? raw)
      .replace(/\s*(sec|s)\.?$/i, '')
      .trim();
    return value ? `${trimZeros(value)} s` : '';
  },
  aperture: (raw) => {
    const value = raw.replace(/^f\//i, '').trim();
    return value ? `f/${trimZeros(value)}` : '';
  },
  iso: (raw) => raw.replace(/^ISO\s*/i, '').trim(),
  focalLength: (raw) => {
    const value = parseFloat(raw);
    return Number.isFinite(value) ? `${trimZeros(String(value))} mm` : '';
  },
  exposureBias: (raw) => {
    const value = parseNumber(raw.replace(/\s*EV$/i, '').trim());
    // Zero is the default; not worth showing.
    return Number.isFinite(value) && Math.round(value * 3) !== 0
      ? `${formatStops(value)} EV`
      : '';
  },
};

// EXIF for one photo, or undefined if Flickr won't share it (the owner can
// hide EXIF in their Flickr privacy settings) or the call fails. Not stored
// in Next's data cache: Flickr reports errors (rate limits included) with
// HTTP 200, which would be cached like a success. The EXIF route caches
// successful answers at the CDN instead.
export const getExif = async (
  photoId: string,
): Promise<PhotoExif | undefined> => {
  try {
    const { photo } = await callFlickr<FlickrExifResponse>(
      'flickr.photos.getExif',
      { photo_id: photoId },
      { cache: 'no-store' },
    );
    const raw = (tags: string[]) =>
      tags
        .map((tag) => photo.exif.find((e) => e.tag === tag)?.raw._content)
        .find(Boolean);

    const exif: PhotoExif = { camera: photo.camera || undefined };
    for (const [field, tags] of Object.entries(EXIF_FIELDS)) {
      const key = field as keyof typeof EXIF_FIELDS;
      const value = raw(tags);
      const formatted = value && formatExif[key](value);
      if (formatted) exif[key] = formatted;
    }
    return exif;
  } catch {
    return undefined;
  }
};
