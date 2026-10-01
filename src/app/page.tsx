import { PhotoSetGrid } from '@/components/PhotoSetGrid';
import { filterPhotosetsByConfig } from '@/config/galleries';
import { getPhotosets } from '@/lib/flickr';

const Home = async () => {
  const photosets = filterPhotosetsByConfig(await getPhotosets());
  return <PhotoSetGrid photosets={photosets} />;
};

export default Home;
