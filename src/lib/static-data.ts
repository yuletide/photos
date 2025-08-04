import { FlickrPhoto, FlickrPhotoset } from '@/types/flickr';
import photosetsData from '@/data/photosets.json';
import photosetsTravelData from '@/data/photosets-travel.json';
import photosetsConcertsData from '@/data/photosets-concerts.json';
import photosetsBestOfData from '@/data/photosets-best-of.json';

// Static data imports - we'll replace these with dynamic imports if needed
const categoryDataMap: Record<string, FlickrPhotoset[]> = {
  travel: photosetsTravelData,
  concerts: photosetsConcertsData,
  'best-of': photosetsBestOfData,
};

export const getPhotoSets = async (category?: string | null): Promise<FlickrPhotoset[]> => {
  // Return category-specific data if category is provided
  if (category && categoryDataMap[category]) {
    return categoryDataMap[category];
  }
  
  // Return all photosets if no category
  return photosetsData;
};

export const getPhotosInSet = async (photosetId: string): Promise<FlickrPhoto[]> => {
  try {
    // Dynamic import for the specific photoset's photos
    const photosData = await import(`@/data/photos/${photosetId}.json`);
    return photosData.default;
  } catch (error) {
    console.error(`Failed to load photos for photoset ${photosetId}:`, error);
    throw new Error(`Failed to fetch photos for photoset ${photosetId}`);
  }
};