'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PhotoSet } from '@/components/PhotoSet';
import { galleryConfig } from '@/config/galleries';
import { FlickrPhotoset } from '@/types/flickr';

const HomeContents = () => {
  
  });

  if (isLoading) return <div className="text-center">Loading...</div>;
  if (isError) return <div className="text-center">Error fetching data</div>;

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
      {photoSets?.map((set) => <PhotoSet key={set.id} set={set} />)}
    </div>
  );
};

const Home = () => {
  return (
    <>
      <nav className="my-8 flex justify-center gap-4">
        <Link href="/" className="text-blue-500 hover:text-blue-700">
          All
        </Link>
        {galleryConfig.map((cat) => (
          <Link
            href={`/?category=${cat.slug}`}
            key={cat.slug}
            className="text-blue-500 hover:text-blue-700"
          >
            {cat.name}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<div className="text-center">Loading...</div>}>
      const searchParams = useSearchParams();
  const category = searchParams.get('category');

  const {
    data: photoSets,
    isLoading,
    isError,
  } = useQuery<FlickrPhotoset[]>({
    queryKey: ['photoSets', category],
    queryFn: async () => {
      const url = category
        ? `/api/photosets?category=${category}`
        : '/api/photosets';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch photo sets');
      }
      return res.json();
    },
      </Suspense>
    </>
  );
};

export default Home;
