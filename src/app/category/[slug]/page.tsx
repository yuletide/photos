import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoSetGrid } from '@/components/PhotoSetGrid';
import {
  filterPhotosetsByConfig,
  galleryConfig,
  getCategory,
} from '@/config/galleries';
import { getPhotosByTags, getPhotosets, withExif } from '@/lib/flickr';

type Props = { params: Promise<{ slug: string }> };

// Only categories from the config exist; anything else 404s.
export const dynamicParams = false;

export const generateStaticParams = () =>
  galleryConfig.map((cat) => ({ slug: cat.slug }));

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { slug } = await params;
  return { title: getCategory(slug)?.name };
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
    getPhotosByTags(category.tags).then(withExif),
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
