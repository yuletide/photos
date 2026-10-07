import { connection } from 'next/server';
import {
  FeaturedPhoto,
  type FeaturedPhotoData,
} from '@/components/FeaturedPhoto';
import { displayTitle, formatDate, plainCaption } from '@/components/PhotoInfo';
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
  date: formatDate(photo),
  src: photo.url_m!,
  // Flickr's pre-sized JPEGs, so phones don't fetch the 2048px one.
  srcSet: SIZES.flatMap((size) => {
    const src = photo[`url_${size}`];
    return src ? [`${src} ${photo[`width_${size}`]}w`] : [];
  }).join(', '),
  width: Number(photo.width_m),
  height: Number(photo.height_m),
});

// A different order each visit, so the front page opens on a random photo
// and ←/→ jump around the whole site. connection() makes the page render per
// request (Flickr data stays cached) instead of once at build time.
const shuffle = async <T,>(items: T[]) => {
  await connection();
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const Home = async () => {
  const [photosets, published] = await Promise.all([
    getPhotosets().then((sets) => filterPhotosetsByConfig(sets)),
    // One album or category failing to load drops the featured photo, not
    // the whole page: the album grid only needs the list above.
    getPublishedPhotos().catch((error) => {
      console.error('Featured photos unavailable:', error);
      return [];
    }),
  ]);
  const featured = await shuffle(
    published
      .filter(({ photo }) => photo.url_m && photo.width_m && photo.height_m)
      .map(toFeatured),
  );

  return (
    <>
      {featured.length > 0 && <FeaturedPhoto photos={featured} />}
      <PhotoSetGrid photosets={photosets} />
    </>
  );
};

export default Home;
