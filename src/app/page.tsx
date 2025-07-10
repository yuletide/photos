import { Suspense } from 'react';
import Link from 'next/link';
import { galleryConfig } from '@/config/galleries';
import { PhotoSetGrid } from '@/components/PhotoSetGrid';

const Home = () => {
  return (
    <>
      <nav className="my-8 flex justify-center gap-4">
        <Link href="/" className="text-blue-500 hover:text-blue-700">
          All
        </Link>
        {galleryConfig.map((cat) => (
          <Link
            href={`/?category=${cat.slug}`}
            key={cat.slug}
            className="text-blue-500 hover:text-blue-700"
          >
            {cat.name}
          </Link>
        ))}
      </nav>
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <PhotoSetGrid />
      </Suspense>
    </>
  );
};

export default Home;
