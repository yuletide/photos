import { LatestPhoto } from '@/components/LatestPhoto';
import { PhotoSetGrid } from '@/components/PhotoSetGrid';
import { filterPhotosetsByConfig } from '@/config/galleries';
import { getPhotosets } from '@/lib/flickr';
import { getLatestPhoto } from '@/lib/published';

const Home = async () => {
  const [photosets, latest] = await Promise.all([
    getPhotosets().then((sets) => filterPhotosetsByConfig(sets)),
    getLatestPhoto(),
  ]);
  return (
    <>
      {latest && <LatestPhoto latest={latest} />}
      <PhotoSetGrid photosets={photosets} />
    </>
  );
};

export default Home;
