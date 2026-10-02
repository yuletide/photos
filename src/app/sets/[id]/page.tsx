import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhotoGrid } from '@/components/PhotoGrid';
import { allPhotosetIds } from '@/config/galleries';
import { getPhotoset } from '@/lib/flickr';
import { shareMetadata } from '@/lib/share';

type Props = { params: Promise<{ id: string }> };

// Only albums listed in the gallery config are published.
export const dynamicParams = false;

export const generateStaticParams = () =>
  allPhotosetIds().map((id) => ({ id }));

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { id } = await params;
  const { title, photos } = await getPhotoset(id);
  return {
    title,
    ...shareMetadata({
      title,
      description: `${photos.length} photographs by Alex Yule.`,
      path: `/sets/${id}`,
      image: photos.find((photo) => photo.url_m),
    }),
  };
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
      <PhotoGrid photos={photos} />
    </>
  );
};

export default SetPage;
