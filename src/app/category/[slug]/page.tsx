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

  return (
    <>
      <h2 className="mb-6 text-center text-xl font-light tracking-wide">
        {category.name}
      </h2>
      <CategoryContent slug={slug} tags={category.tags} />
    </>
  );
};

const CategoryContent = async ({
  slug,
  tags,
}: {
  slug: string;
  tags?: string[];
}) => {
  if (!tags?.length) {
    const photosets = filterPhotosetsByConfig(await getPhotosets(), slug);
    return <PhotoSetGrid photosets={photosets} />;
  }

  const hasAlbums = Boolean(getCategory(slug)?.photosetIds.length);
  const [photos, photosets] = await Promise.all([
    getPhotosByTags(tags),
    hasAlbums
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
