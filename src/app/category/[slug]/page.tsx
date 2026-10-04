import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoSetGrid } from '@/components/PhotoSetGrid';
import {
  filterPhotosetsByConfig,
  galleryConfig,
  getCategory,
} from '@/config/galleries';
import { getPhotosByTags, getPhotosets } from '@/lib/flickr';
import { shareMetadata } from '@/lib/share';

type Props = { params: Promise<{ slug: string }> };

// Only categories from the config exist; anything else 404s.
export const dynamicParams = false;

export const generateStaticParams = () =>
  galleryConfig.map((cat) => ({ slug: cat.slug }));

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  // Preview with the first photo on the page: album covers come first, then
  // tagged photos.
  const cover = filterPhotosetsByConfig(await getPhotosets(), slug).find(
    (set) => set.primary_photo_extras?.url_m,
  )?.primary_photo_extras;
  const image =
    cover ??
    (category.tags?.length
      ? (await getPhotosByTags(category.tags)).find((photo) => photo.url_m)
      : undefined);
  return {
    title: category.name,
    ...shareMetadata({
      title: category.name,
      description: `${category.name} photographs by Alex Yule.`,
      path: `/category/${slug}`,
      image,
    }),
  };
};

const CategoryPage = async ({ params }: Props) => {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  if (!category.tags?.length) {
    const photosets = filterPhotosetsByConfig(await getPhotosets(), slug);
    return <PhotoSetGrid photosets={photosets} />;
  }

  const [photos, photosets] = await Promise.all([
    getPhotosByTags(category.tags),
    category.photosetIds.length
      ? getPhotosets().then((sets) => filterPhotosetsByConfig(sets, slug))
      : [],
  ]);

  if (photos.length === 0 && photosets.length === 0) {
    return <p className="text-center text-gray-500">No photos here yet.</p>;
  }

  return (
    <div className="space-y-12">
      {photosets.length > 0 && <PhotoSetGrid photosets={photosets} />}
      {photos.length > 0 && <PhotoGrid photos={photos} />}
    </div>
  );
};

export default CategoryPage;
