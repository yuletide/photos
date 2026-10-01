import Image from 'next/image';
import { FlickrPhoto } from '@/types/flickr';

// Images above the fold load eagerly to keep LCP fast.
const EAGER_COUNT = 6;

export const PhotoGrid = ({ photos }: { photos: FlickrPhoto[] }) => (
  <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
    {photos
      .filter((photo) => photo.url_m)
      .map((photo, i) => (
        <a
          key={photo.id}
          href={photo.url_l ?? photo.url_m}
          className="block break-inside-avoid hover:opacity-80 transition-opacity"
        >
          <Image
            src={photo.url_m!}
            alt={photo.title}
            width={photo.width_m}
            height={photo.height_m}
            loading={i < EAGER_COUNT ? 'eager' : 'lazy'}
            className="w-full h-auto"
          />
        </a>
      ))}
  </div>
);
