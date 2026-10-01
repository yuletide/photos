import { allPhotosetIds, galleryConfig } from '@/config/galleries';
import { getPhotoset, getPhotosByTags } from '@/lib/flickr';
import { FlickrPhoto } from '@/types/flickr';

export interface PublishedPhoto {
  photo: FlickrPhoto;
  // The album or category page the photo appears on.
  href: string;
}

// Every photo on the site: in a configured album or a tag-based category,
// each listed once (first page it appears on wins). Uses the same (hourly
// cached) Flickr calls as the pages, so it costs no extra API requests once
// the pages have been built.
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

export const isPublishedPhoto = async (photoId: string) =>
  (await getPublishedPhotos()).some(({ photo }) => photo.id === photoId);

// The most recently uploaded photo on the site, for the front page.
export const getLatestPhoto = async (): Promise<PublishedPhoto | undefined> =>
  (await getPublishedPhotos())
    .filter(({ photo }) => photo.url_m)
    .reduce<PublishedPhoto | undefined>(
      (latest, entry) =>
        !latest ||
        Number(entry.photo.dateupload ?? 0) >
          Number(latest.photo.dateupload ?? 0)
          ? entry
          : latest,
      undefined,
    );
