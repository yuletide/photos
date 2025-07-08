import { FlickrPhoto, FlickrPhotoset } from '@/types/flickr';

export const getPhotoSets = async (): Promise<FlickrPhotoset[]> => {
  const response = await fetch('/api/photosets');
  if (!response.ok) {
    throw new Error('Failed to fetch photosets');
  }
  return response.json();
};

export const getPhotosInSet = async (
  photosetId: string,
): Promise<FlickrPhoto[]> => {
  const response = await fetch(`/api/photosets/${photosetId}/photos`);
  if (!response.ok) {
    throw new Error(`Failed to fetch photos for photoset ${photosetId}`);
  }
  return response.json();
};
