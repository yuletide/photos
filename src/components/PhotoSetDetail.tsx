'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FlickrPhoto } from '@/types/flickr';
import { getPhotosInSet } from '@/lib/static-data';

interface PhotoSetDetailProps {
  photosetId: string;
}

const PhotoSetDetail = ({ photosetId }: PhotoSetDetailProps) => {
  const {
    data: photos,
    isLoading,
    isError,
  } = useQuery<FlickrPhoto[]>({
    queryKey: ['photos', photosetId],
    queryFn: () => getPhotosInSet(photosetId),
  });

  if (isLoading) {
    return <div className="text-center">Loading photos...</div>;
  }

  if (isError) {
    return (
      <div className="text-center">
        <p>Error loading photos</p>
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to gallery
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Gallery
      </Link>
      
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {photos?.map((photo) => (
          <div key={photo.id} className="break-inside-avoid">
            <Image
              src={photo.url_l || photo.url_m || ''}
              alt={photo.title}
              width={photo.width_l || photo.width_m || 500}
              height={photo.height_l || photo.height_m || 500}
              className="w-full h-auto"
            />
            {photo.title && (
              <p className="mt-2 text-sm text-gray-400">{photo.title}</p>
            )}
            {photo.description?._content && (
              <p className="mt-1 text-xs text-gray-500">
                {photo.description._content}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoSetDetail;