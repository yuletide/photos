import {
  FlickrPhoto,
  FlickrPhotoset,
  FlickrPhotosetPhotosResponse,
  FlickrPhotosetsResponse,
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

export const getPhotosets = async (): Promise<FlickrPhotoset[]> => {
  const res = await callFlickr<FlickrPhotosetsResponse>(
    'flickr.photosets.getList',
    { per_page: '500', primary_photo_extras: 'url_m' },
  );
  return res.photosets.photoset;
};

export const getPhotoset = async (
  photosetId: string,
): Promise<{ title: string; photos: FlickrPhoto[] }> => {
  const res = await callFlickr<FlickrPhotosetPhotosResponse>(
    'flickr.photosets.getPhotos',
    {
      photoset_id: photosetId,
      per_page: '500',
      extras: 'url_m,url_l,description',
    },
  );
  return { title: res.photoset.title, photos: res.photoset.photo };
};
