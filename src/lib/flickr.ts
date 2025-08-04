import { FlickrPhoto, FlickrPhotoset } from '@/types/flickr';
import { getPhotoSets as getStaticPhotoSets, getPhotosInSet as getStaticPhotosInSet } from '@/lib/static-data';

export const getPhotoSets = async (): Promise<FlickrPhotoset[]> => {
  return getStaticPhotoSets();
};

export const getPhotosInSet = async (
  photosetId: string,
): Promise<FlickrPhoto[]> => {
  return getStaticPhotosInSet(photosetId);
};
