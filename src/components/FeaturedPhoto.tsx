'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

// Just what the front page needs per photo; the full list is sent to the
// browser so ←/→ can step through it.
export interface FeaturedPhotoData {
  id: string;
  // The photo on its album/category page, opened in the lightbox.
  href: string;
  title: string;
  caption: string;
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

// The rendered width is the smaller of the page width (100vw minus main's
// 2rem padding) and 70vh x the photo's aspect ratio (the height cap). The
// height cap binds once the viewport is wider than 0.7 x ratio, so express
// that as an aspect-ratio media condition the browser can use to pick a size.
export const imageSizes = ({ width, height }: FeaturedPhotoData) => {
  const ratio = width / height || 1;
  const switchAt = Math.round(0.7 * ratio * 1000);
  return `(max-aspect-ratio: ${switchAt}/1000) calc(100vw - 2rem), calc(70vh * ${ratio.toFixed(3)})`;
};

// Warm the cache for a photo the viewer may step to next.
const preload = (photo: FeaturedPhotoData) => {
  const img = new window.Image();
  img.sizes = imageSizes(photo); // before srcset, so the right size is picked
  img.srcset = photo.srcSet;
  img.src = photo.src;
};

const Arrow = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
    <path
      fill="currentColor"
      d={
        direction === 'left'
          ? 'M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z'
          : 'M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z'
      }
    />
  </svg>
);

// Front page: one photo, large, with its caption. ←/→ (buttons or keys) step
// through the rest in the order given (shuffled per visit, so it starts on a
// random photo); clicking opens it in the lightbox on its album/category page.
export const FeaturedPhoto = ({ photos }: { photos: FeaturedPhotoData[] }) => {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const step = (by: number) => setIndex((i) => (i + by + count) % count);
  const photo = photos[index];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [count]);

  const image = useRef<HTMLImageElement>(null);
  const preloadNeighbors = useCallback(() => {
    if (count < 2) return;
    preload(photos[(index + 1) % count]);
    preload(photos[(index - 1 + count) % count]);
  }, [photos, index, count]);

  // The first image can finish loading before hydration, when onLoad isn't
  // attached yet; preloaded neighbors are also complete as soon as shown.
  useEffect(() => {
    if (image.current?.complete) preloadNeighbors();
  }, [preloadNeighbors]);

  const arrowClass =
    'absolute top-1/2 -translate-y-1/2 p-2 text-white/70 drop-shadow transition-colors hover:text-white';

  return (
    <figure className="mx-auto mb-16 w-fit max-w-full">
      <div className="relative">
        <Link href={`${photo.href}?photo=${photo.id}`} className="block">
          {/* Flickr serves pre-sized JPEGs; next/image optimization is off. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={photo.id}
            ref={image}
            src={photo.src}
            srcSet={photo.srcSet}
            sizes={imageSizes(photo)}
            width={photo.width}
            height={photo.height}
            // The link's only content, so it names the link: never a file name.
            alt={photo.title || photo.caption.split('\n')[0] || 'Photo'}
            fetchPriority="high"
            onLoad={preloadNeighbors}
            className="mx-auto h-auto max-h-[70vh] w-auto max-w-full"
          />
        </Link>
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => step(-1)}
              className={`${arrowClass} left-0`}
            >
              <Arrow direction="left" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => step(1)}
              className={`${arrowClass} right-0`}
            >
              <Arrow direction="right" />
            </button>
          </>
        )}
      </div>
      {(photo.title || photo.caption) && (
        <figcaption className="mt-3 max-w-prose space-y-1">
          {photo.title && (
            <p className="text-sm text-gray-200">{photo.title}</p>
          )}
          {photo.caption && (
            <p className="whitespace-pre-line text-[13px] text-gray-400">
              {photo.caption}
            </p>
          )}
        </figcaption>
      )}
    </figure>
  );
};
