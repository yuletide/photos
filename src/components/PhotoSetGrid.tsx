'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { PhotoSet } from '@/components/PhotoSet';
import { FlickrPhotoset } from '@/types/flickr';
import { getPhotoSets } from '@/lib/static-data';

export const PhotoSetGrid = () => {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');

  const {
    data: photoSets,
    isLoading,
    isError,
  } = useQuery<FlickrPhotoset[]>({
    queryKey: ['photoSets', category],
    queryFn: () => getPhotoSets(category),
  });

  if (isLoading) return <div className="text-center">Loading...</div>;
  if (isError) return <div className="text-center">Error fetching data</div>;

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
      {photoSets?.map((set) => <PhotoSet key={set.id} set={set} />)}
    </div>
  );
};
