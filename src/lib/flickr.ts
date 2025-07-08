import { unstable_cache } from 'next/cache';
import { createFlickr } from 'flickr-sdk';
import { FlickrPhoto, FlickrPhotoset } from '@/types/flickr';

const API_KEY = process.env.FLICKR_API_KEY;

if (!API_KEY) {
  throw new Error('Flickr API key must be provided in environment variables.');
}

const { flickr } = createFlickr(API_KEY);

export const getPhotoSets = unstable_cache(
  async (): Promise<FlickrPhotoset[]> => {
    const res = await flickr('flickr.photosets.getList', {
      primary_photo_extras: 'url_m',
    });
    console.log('Fetched photosets:', res.photosets.photoset);
    return res.photosets.photoset;
  },
  ['flickr-photosets'],
  { revalidate: 3600 }, // Revalidate every hour
);

export const getPhotosInSet = (photosetId: string, userId: string) =>
  unstable_cache(
    async (): Promise<FlickrPhoto[]> => {
      const res = await flickr('flickr.photosets.getPhotos', {
        photoset_id: photosetId,
        user_id: userId,
        extras: 'url_m,url_l,url_o,description',
      });
      return res.photoset.photo;
    },
    ['flickr-photos-in-set', photosetId],
    { revalidate: 3600 }, // Revalidate every hour
  )();
