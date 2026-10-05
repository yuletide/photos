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
import { photoShareMetadata, shareMetadata, sharedPhoto } from '@/lib/share';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ photo?: string | string[] }>;
};

// Only categories from the config exist; anything else 404s.
export const dynamicParams = false;

export const generateStaticParams = () =>
  galleryConfig.map((cat) => ({ slug: cat.slug }));

// A link to one photo (?photo=<id>) previews that photo; reading the query
// makes this page render per request rather than at build time.
export const generateMetadata = async ({
  params,
  searchParams,
}: Props): Promise<Metadata> => {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const { photo: photoId } = await searchParams;
  if (photoId && category.tags?.length) {
    const photo = sharedPhoto(await getPhotosByTags(category.tags), photoId);
    if (photo) {
      return {
        title: category.name,
        ...photoShareMetadata({
          photo,
          pageTitle: category.name,
          path: `/category/${slug}`,
        }),
      };
    }
  }
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
