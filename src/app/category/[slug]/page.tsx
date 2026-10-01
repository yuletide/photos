import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhotoSetGrid } from '@/components/PhotoSetGrid';
import {
  filterPhotosetsByConfig,
  galleryConfig,
  getCategory,
} from '@/config/galleries';
import { getPhotosets } from '@/lib/flickr';

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
  if (!getCategory(slug)) notFound();

  const photosets = filterPhotosetsByConfig(await getPhotosets(), slug);
  return <PhotoSetGrid photosets={photosets} />;
};

export default CategoryPage;
