import {
  FlickrPhoto,
  FlickrPhotoset,
  FlickrPhotosetPhotosResponse,
  FlickrPhotosetsResponse,
  FlickrPhotosSearchResponse,
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

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
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

// Grid thumbnails (m) plus the larger sizes the lightbox picks from.
const PHOTO_EXTRAS = 'url_m,url_l,url_h,url_k,description';

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
        primary_photo_extras: 'url_m',
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
