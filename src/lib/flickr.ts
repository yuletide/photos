import { unstable_cache } from 'next/cache';
import { FlickrPhoto, FlickrPhotoset } from '@/types/flickr';
import flickr from './flickr-sdk-wrapper';

const USER_ID = process.env.FLICKR_USER_ID;

if (!USER_ID) {
  throw new Error('Flickr User ID must be provided in environment variables.');
}

export const getPhotoSets = unstable_cache(
  async (): Promise<FlickrPhotoset[]> => {
    const res = await flickr.photosets.getList({
      user_id: USER_ID,
      primary_photo_extras: 'url_m',
      format: 'json',
      nojsoncallback: 1,
    });
    return res.body.photosets.photoset;
  },
  ['flickr-photosets'],
  { revalidate: 3600 }, // Revalidate every hour
);

export const getPhotosInSet = (photosetId: string) =>
  unstable_cache(
    async (): Promise<FlickrPhoto[]> => {
      const res = await flickr.photosets.getPhotos({
        photoset_id: photosetId,
        user_id: USER_ID,
        extras: 'url_m,url_l,url_o,description',
        format: 'json',
        nojsoncallback: 1,
      });
      return res.body.photoset.photo;
    },
    ['flickr-photos-in-set', photosetId],
    { revalidate: 3600 }, // Revalidate every hour
  )();
