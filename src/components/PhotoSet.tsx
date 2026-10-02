import { Tile, TileData } from '@/components/Tile';
import { FlickrPhotoset } from '@/types/flickr';

export const photosetTile = (set: FlickrPhotoset): TileData => ({
  key: set.id,
  href: `/sets/${set.id}`,
  title: set.title._content,
  count: set.count_photos,
  cover: set.primary_photo_extras,
});

export const PhotoSet = ({
  set,
  eager = false,
}: {
  set: FlickrPhotoset;
  eager?: boolean;
}) => <Tile tile={photosetTile(set)} eager={eager} />;
