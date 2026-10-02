import { photosetTile } from '@/components/PhotoSet';
import { TileGrid } from '@/components/PhotoSetGrid';
import { TileData } from '@/components/Tile';
import { galleryConfig } from '@/config/galleries';
import { getPhotosByTags, getPhotosets } from '@/lib/flickr';

// Everything on the site, in config order: each category's albums, plus one
// tile for each tag-based category (cover = its newest photo).
const allTiles = async (): Promise<TileData[]> => {
  const photosets = new Map((await getPhotosets()).map((s) => [s.id, s]));
  const seen = new Set<string>();

  const perCategory = await Promise.all(
    galleryConfig.map(async (category) => {
      const albums = category.photosetIds
        .filter((id) => !seen.has(id) && seen.add(id))
        .map((id) => photosets.get(id))
        .filter((set) => set !== undefined)
        .map(photosetTile);

      if (!category.tags?.length) return albums;
      const photos = await getPhotosByTags(category.tags);
      if (photos.length === 0) return albums;
      const tagTile: TileData = {
        key: `category-${category.slug}`,
        href: `/category/${category.slug}`,
        title: category.name,
        count: photos.length,
        cover: photos.find((photo) => photo.url_m),
      };
      return [...albums, tagTile];
    }),
  );
  return perCategory.flat();
};

const Home = async () => <TileGrid tiles={await allTiles()} />;

export default Home;
