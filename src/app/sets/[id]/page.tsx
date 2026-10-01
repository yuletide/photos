import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { allPhotosetIds } from '@/config/galleries';
import { getPhotoset } from '@/lib/flickr';

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
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {photos.map(
          (photo, i) =>
            photo.url_m && (
              <a
                key={photo.id}
                href={photo.url_l ?? photo.url_m}
                className="block break-inside-avoid hover:opacity-80 transition-opacity"
              >
                <Image
                  src={photo.url_m}
                  alt={photo.title}
                  width={photo.width_m}
                  height={photo.height_m}
                  loading={i < 6 ? 'eager' : 'lazy'}
                  className="w-full h-auto"
                />
              </a>
            ),
        )}
      </div>
    </>
  );
};

export default SetPage;
