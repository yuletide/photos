import { allPhotosetIds, galleryConfig } from '@/config/galleries';
import { getPhotoset, getPhotosByTags } from '@/lib/flickr';
import { FlickrPhoto } from '@/types/flickr';

export interface PublishedPhoto {
  photo: FlickrPhoto;
  // The album or category page the photo appears on.
  href: string;
}

// Every photo on the site, in site order (albums in config order, then
// tag-based categories), each listed once: the first page it appears on wins.
// Uses the same (hourly cached) Flickr calls as the pages, so this costs no
// extra API requests once the pages have been built.
export const getPublishedPhotos = async (): Promise<PublishedPhoto[]> => {
  const pages = await Promise.all([
    ...allPhotosetIds().map((id) =>
      getPhotoset(id).then(({ photos }) => ({ href: `/sets/${id}`, photos })),
    ),
    ...galleryConfig
      .filter((category) => category.tags?.length)
      .map((category) =>
        getPhotosByTags(category.tags!).then((photos) => ({
          href: `/category/${category.slug}`,
          photos,
        })),
      ),
  ]);

  const seen = new Map<string, PublishedPhoto>();
  for (const { href, photos } of pages) {
    for (const photo of photos) {
      if (!seen.has(photo.id)) seen.set(photo.id, { photo, href });
    }
  }
  return [...seen.values()];
};

// Whether a photo appears anywhere on the site.
export const isPublishedPhoto = async (photoId: string) =>
  (await getPublishedPhotos()).some(({ photo }) => photo.id === photoId);
