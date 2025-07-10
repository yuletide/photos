interface GalleryCategory {
  name: string;
  slug: string;
  photosetIds: string[];
}

// This is where you'll manually configure your galleries.
// The photosetIds are the IDs of your Flickr albums.
export const galleryConfig: GalleryCategory[] = [
  {
    name: 'Trips',
    slug: 'trips',
    photosetIds: [
      '72157719993353008', // Example: "Japan 2023"
      '72157712885336336', // Example: "Iceland 2022"
    ],
  },
  {
    name: 'Concerts',
    slug: 'concerts',
    photosetIds: [
      '72157709582155772', // Example: "Taylor Swift"
    ],
  },
  {
    name: 'Best Of',
    slug: 'best-of',
    photosetIds: [
      '72157691024744483', // Example: "Best of 2023"
    ],
  },
];

interface Photoset {
  id: string;
  [key: string]: unknown;
}

export const filterPhotosetsByConfig = (
  photosets: Photoset[],
  categorySlug?: string | null,
): Photoset[] => {
  let allowedIds: string[];

  if (categorySlug) {
    const category = galleryConfig.find((c) => c.slug === categorySlug);
    allowedIds = category ? category.photosetIds : [];
  } else {
    // If no category, get all unique IDs from the config
    allowedIds = [
      ...new Set(galleryConfig.flatMap((category) => category.photosetIds)),
    ];
  }

  const photosetMap = new Map(photosets.map((set) => [set.id, set]));

  // Return the photosets in the order they are defined in the config
  return allowedIds
    .map((id) => photosetMap.get(id))
    .filter((set): set is Photoset => set !== undefined);
};
