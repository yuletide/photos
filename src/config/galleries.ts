export interface GalleryCategory {
  name: string;
  slug: string;
  photosetIds: string[];
}

// This is where you'll manually configure your galleries.
// The photosetIds are the IDs of your Flickr albums.
export const galleryConfig: GalleryCategory[] = [
  {
    name: 'Travel',
    slug: 'travel',
    photosetIds: [
      '72157673637437610', // Example: "Japan 2023"
      '72177720327261716', // Example: "Iceland 2022"
      '72157613054729173',
    ],
  },
  {
    name: 'Concerts',
    slug: 'concerts',
    photosetIds: [
      '72177720327288509', // Example: "Taylor Swift"
      '72177720316800271',
    ],
  },
  {
    name: 'Best Of',
    slug: 'best-of',
    photosetIds: [
      '72157603655578863', // Example: "Best of 2023"
    ],
  },
];

export const getCategory = (slug: string) =>
  galleryConfig.find((c) => c.slug === slug);

// Every photoset shown anywhere on the site, deduped, in config order.
export const allPhotosetIds = () => [
  ...new Set(galleryConfig.flatMap((category) => category.photosetIds)),
];

// Pick the configured photosets (optionally for one category), preserving
// config order and dropping any IDs that Flickr didn't return.
export const filterPhotosetsByConfig = <T extends { id: string }>(
  photosets: T[],
  categorySlug?: string | null,
): T[] => {
  const allowedIds = categorySlug
    ? (getCategory(categorySlug)?.photosetIds ?? [])
    : allPhotosetIds();

  const photosetMap = new Map(photosets.map((set) => [set.id, set]));
  return allowedIds
    .map((id) => photosetMap.get(id))
    .filter((set): set is T => set !== undefined);
};
