import { connection } from 'next/server';
import {
  FeaturedPhoto,
  type FeaturedPhotoData,
} from '@/components/FeaturedPhoto';
import { displayTitle, plainCaption } from '@/components/PhotoInfo';
import { PhotoSetGrid } from '@/components/PhotoSetGrid';
import { filterPhotosetsByConfig } from '@/config/galleries';
import { getPhotosets } from '@/lib/flickr';
import { getPublishedPhotos, type PublishedPhoto } from '@/lib/published';

const SIZES = ['m', 'l', 'h', 'k'] as const;

const toFeatured = ({ photo, href }: PublishedPhoto): FeaturedPhotoData => ({
  id: photo.id,
  href,
  title: displayTitle(photo.title),
  caption: plainCaption(photo.description?._content),
  src: photo.url_m!,
  // Flickr's pre-sized JPEGs, so phones don't fetch the 2048px one.
  srcSet: SIZES.flatMap((size) => {
    const src = photo[`url_${size}`];
    return src ? [`${src} ${photo[`width_${size}`]}w`] : [];
  }).join(', '),
  width: Number(photo.width_m),
  height: Number(photo.height_m),
});

// A different photo each visit. connection() makes the page render per
// request (Flickr data stays cached) instead of once at build time.
const pickStart = async (count: number) => {
  await connection();
  return Math.floor(Math.random() * count);
};

const Home = async () => {
  const [photosets, published] = await Promise.all([
    getPhotosets().then((sets) => filterPhotosetsByConfig(sets)),
    getPublishedPhotos(),
  ]);
  const featured = published
    .filter(({ photo }) => photo.url_m && photo.width_m && photo.height_m)
    .map(toFeatured);
  const start = await pickStart(featured.length);

  return (
    <>
      {featured.length > 0 && <FeaturedPhoto photos={featured} start={start} />}
      <PhotoSetGrid photosets={photosets} />
    </>
  );
};

export default Home;
