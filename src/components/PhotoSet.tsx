import Image from 'next/image';
import Link from 'next/link';
import { FlickrPhotoset } from '@/types/flickr';

export const PhotoSet = ({
  set,
  eager = false,
}: {
  set: FlickrPhotoset;
  eager?: boolean;
}) => {
  const cover = set.primary_photo_extras;

  return (
    <div className="break-inside-avoid">
      <Link href={`/sets/${set.id}`} className="block group">
        {cover?.url_m && (
          <Image
            src={cover.url_m}
            alt={set.title._content}
            width={cover.width_m}
            height={cover.height_m}
            loading={eager ? 'eager' : 'lazy'}
            className="w-full h-auto group-hover:opacity-80 transition-opacity"
          />
        )}
        <div className="mt-2">
          <h2 className="font-medium text-gray-200 group-hover:text-white transition-colors">
            {set.title._content}
          </h2>
          <p className="text-sm text-gray-500">{set.count_photos} photos</p>
        </div>
      </Link>
    </div>
  );
};
