'use client';

import { useQuery } from '@tanstack/react-query';
import { getPhotoSets } from '@/lib/flickr';
import { PhotoSet } from '@/components/PhotoSet';

const Home = () => {
  const {
    data: photoSets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['photoSets'],
    queryFn: getPhotoSets,
  });

  if (isLoading) return <div className="text-center">Loading...</div>;
  if (isError) return <div className="text-center">Error fetching data</div>;

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
      {photoSets?.map((set) => <PhotoSet key={set.id} set={set} />)}
    </div>
  );
};

export default Home;
