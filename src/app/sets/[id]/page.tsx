import { Suspense } from 'react';
import PhotoSetDetail from '@/components/PhotoSetDetail';
import { getPhotoSets } from '@/lib/static-data';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  const photoSets = await getPhotoSets();
  
  return photoSets.map((set) => ({
    id: set.id,
  }));
}

const PhotoSetPage = async ({ params }: PageProps) => {
  const { id } = await params;
  
  return (
    <Suspense fallback={<div className="text-center">Loading photos...</div>}>
      <PhotoSetDetail photosetId={id} />
    </Suspense>
  );
};

export default PhotoSetPage;