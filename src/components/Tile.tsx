import Image from 'next/image';
import Link from 'next/link';

// One cover tile in a grid: an album, or a tag-based category on the All page.
export interface TileData {
  key: string;
  href: string;
  title: string;
  count: number;
  cover?: { url_m?: string; width_m?: number; height_m?: number };
}

// Whether a tile has enough to render its cover image.
export const hasCover = (
  tile: TileData,
): tile is TileData & { cover: Required<NonNullable<TileData['cover']>> } =>
  Boolean(tile.cover?.url_m && tile.cover.width_m && tile.cover.height_m);

export const Tile = ({
  tile,
  eager = false,
}: {
  tile: TileData;
  eager?: boolean;
}) => (
  <div className="break-inside-avoid">
    <Link href={tile.href} className="block group">
      {hasCover(tile) && (
        <Image
          src={tile.cover.url_m}
          alt={tile.title}
          width={tile.cover.width_m}
          height={tile.cover.height_m}
          loading={eager ? 'eager' : 'lazy'}
          className="w-full h-auto group-hover:opacity-80 transition-opacity"
        />
      )}
      <div className="mt-2">
        <h2 className="font-medium text-gray-200 group-hover:text-white transition-colors">
          {tile.title}
        </h2>
        <p className="text-sm text-gray-500">{tile.count} photos</p>
      </div>
    </Link>
  </div>
);
