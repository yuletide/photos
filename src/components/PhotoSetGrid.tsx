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

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
      {photosets.map((set, i) => (
        <PhotoSet key={set.id} set={set} eager={i < EAGER_COUNT} />
      ))}
    </div>
  );
};
