import { TileGrid } from '@/components/PhotoSetGrid';
import { TileData } from '@/components/Tile';
import { galleryConfig } from '@/config/galleries';
import { getPhotosByTags, getPhotosets } from '@/lib/flickr';

// The All page: one tile per category, in nav order, each opening its
// category page. Cover: its first album's cover, else its newest tagged
// photo. Count: the photos in its albums plus its tagged photos. Categories
// with nothing in them yet are left out.
const categoryTiles = async (): Promise<TileData[]> => {
  const photosets = new Map((await getPhotosets()).map((s) => [s.id, s]));
  const tiles = await Promise.all(
    galleryConfig.map(async (category) => {
      const albums = category.photosetIds
        .map((id) => photosets.get(id))
        .filter((set) => set !== undefined);
      const tagged = category.tags?.length
        ? await getPhotosByTags(category.tags)
        : [];
      const count =
        albums.reduce((n, set) => n + Number(set.count_photos), 0) +
        tagged.length;
      if (count === 0) return [];
      const tile: TileData = {
        key: category.slug,
        href: `/category/${category.slug}`,
        title: category.name,
        count,
        cover:
          albums.find((set) => set.primary_photo_extras?.url_m)
            ?.primary_photo_extras ?? tagged.find((photo) => photo.url_m),
      };
      return [tile];
    }),
  );
  return tiles.flat();
};

const Home = async () => <TileGrid tiles={await categoryTiles()} />;

export default Home;
