import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhotoGrid } from '@/components/PhotoGrid';
import { allPhotosetIds } from '@/config/galleries';
import { getPhotoset, withExif } from '@/lib/flickr';

type Props = { params: Promise<{ id: string }> };

// Only albums listed in the gallery config are published.
export const dynamicParams = false;

export const generateStaticParams = () =>
  allPhotosetIds().map((id) => ({ id }));

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { id } = await params;
  const { title } = await getPhotoset(id);
  return { title };
};

const SetPage = async ({ params }: Props) => {
  const { id } = await params;
  if (!allPhotosetIds().includes(id)) notFound();

  const { title, photos } = await getPhotoset(id);

  return (
    <>
      <h2 className="mb-6 text-center text-xl font-light tracking-wide">
        {title}
      </h2>
      <PhotoGrid photos={await withExif(photos)} />
    </>
  );
};

export default SetPage;
