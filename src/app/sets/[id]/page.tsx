import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhotoGrid } from '@/components/PhotoGrid';
import { allPhotosetIds } from '@/config/galleries';
import { getPhotoset } from '@/lib/flickr';
import { photoShareMetadata, shareMetadata, sharedPhoto } from '@/lib/share';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photo?: string | string[] }>;
};

// Only albums listed in the gallery config are published.
export const dynamicParams = false;

export const generateStaticParams = () =>
  allPhotosetIds().map((id) => ({ id }));

// A link to one photo (?photo=<id>) previews that photo; reading the query
// makes this page render per request rather than at build time.
export const generateMetadata = async ({
  params,
  searchParams,
}: Props): Promise<Metadata> => {
  const { id } = await params;
  const { title, photos } = await getPhotoset(id);
  const photo = sharedPhoto(photos, (await searchParams).photo);
  if (photo) {
    return {
      title,
      ...photoShareMetadata({ photo, pageTitle: title, path: `/sets/${id}` }),
    };
  }
  return {
    title,
    ...shareMetadata({
      title,
      description: `${photos.length} ${photos.length === 1 ? 'photograph' : 'photographs'} by Alex Yule.`,
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
