import { allPhotosetIds, galleryConfig } from '@/config/galleries';
import { getPhotoset, getPhotosByTags } from '@/lib/flickr';

// Whether a photo appears anywhere on the site: in a configured album or a
// tag-based category. Uses the same (hourly cached) Flickr calls as the pages,
// so this costs no extra API requests once the pages have been built.
export const isPublishedPhoto = async (photoId: string) => {
  const lists = await Promise.all([
    ...allPhotosetIds().map((id) =>
      getPhotoset(id).then(({ photos }) => photos),
    ),
    ...galleryConfig
      .filter((category) => category.tags?.length)
      .map((category) => getPhotosByTags(category.tags!)),
  ]);
  return lists.some((photos) => photos.some((photo) => photo.id === photoId));
};
