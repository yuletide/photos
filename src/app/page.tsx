import { getPhotoSets } from '@/lib/flickr';
import { PhotoSet } from '@/components/PhotoSet';

const Home = async () => {
  const photoSets = await getPhotoSets();

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
      {photoSets.map((set) => (
        <PhotoSet key={set.id} set={set} />
      ))}
    </div>
  );
};

export default Home;
