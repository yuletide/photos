import { Suspense } from 'react';
import { PhotoSetGrid } from '@/components/PhotoSetGrid';

const Home = () => {
  return (
    <>
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <PhotoSetGrid />
      </Suspense>
    </>
  );
};

export default Home;
