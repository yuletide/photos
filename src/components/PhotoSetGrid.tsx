import { photosetTile } from '@/components/PhotoSet';
import { Tile, TileData, hasCover } from '@/components/Tile';
import { FlickrPhotoset } from '@/types/flickr';

// Images above the fold load eagerly to keep LCP fast.
const EAGER_COUNT = 6;

export const TileGrid = ({ tiles }: { tiles: TileData[] }) => {
  if (tiles.length === 0) {
    return <p className="text-center text-gray-500">No albums here yet.</p>;
  }

  // Count only tiles that actually render a cover image.
  const eagerKeys = new Set(
    tiles
      .filter(hasCover)
      .slice(0, EAGER_COUNT)
      .map((tile) => tile.key),
  );

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
      {tiles.map((tile) => (
        <Tile key={tile.key} tile={tile} eager={eagerKeys.has(tile.key)} />
      ))}
    </div>
  );
};

export const PhotoSetGrid = ({
  photosets,
}: {
  photosets: FlickrPhotoset[];
}) => <TileGrid tiles={photosets.map(photosetTile)} />;
