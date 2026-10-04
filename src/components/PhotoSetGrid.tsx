import { PhotoSet } from '@/components/PhotoSet';
import { FlickrPhotoset } from '@/types/flickr';

// Images above the fold load eagerly to keep LCP fast.
const EAGER_COUNT = 6;

export const PhotoSetGrid = ({
  photosets,
}: {
  photosets: FlickrPhotoset[];
}) => {
  if (photosets.length === 0) {
    return <p className="text-center text-gray-500">No albums here yet.</p>;
  }

  // Count only albums that actually render a cover image.
  const eagerIds = new Set(
    photosets
      .filter((set) => set.primary_photo_extras?.url_m)
      .slice(0, EAGER_COUNT)
      .map((set) => set.id),
  );

  return (
    <div className="columns-2 lg:columns-3 gap-3 space-y-3 md:gap-4 md:space-y-4">
      {photosets.map((set) => (
        <PhotoSet key={set.id} set={set} eager={eagerIds.has(set.id)} />
      ))}
    </div>
  );
};
