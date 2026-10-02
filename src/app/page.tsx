import type { Metadata } from 'next';
import { PhotoSetGrid } from '@/components/PhotoSetGrid';
import { filterPhotosetsByConfig } from '@/config/galleries';
import { getPhotosets } from '@/lib/flickr';
import { shareMetadata } from '@/lib/share';

export const generateMetadata = async (): Promise<Metadata> =>
  shareMetadata({
    description: 'Photographs by Alex Yule.',
    path: '/',
    image: filterPhotosetsByConfig(await getPhotosets())[0]
      ?.primary_photo_extras,
  });

const Home = async () => {
  const photosets = filterPhotosetsByConfig(await getPhotosets());
  return <PhotoSetGrid photosets={photosets} />;
};

export default Home;
