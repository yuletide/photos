'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

// Just what the front page needs per photo; the full list is sent to the
// browser so ←/→ can step through it.
export interface FeaturedPhotoData {
  id: string;
  // The photo on its album/category page, opened in the lightbox.
  href: string;
  title: string;
  caption: string;
  // When it was taken ("November 9, 2017"); empty if Flickr doesn't know.
  date: string;
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

// How long each photo stays up while the slideshow plays.
export const SLIDE_MS = 6000;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const prefersReducedMotion = () =>
  window.matchMedia?.(REDUCED_MOTION).matches ?? false;
const subscribeToMotion = (onChange: () => void) => {
  const query = window.matchMedia?.(REDUCED_MOTION);
  query?.addEventListener?.('change', onChange);
  return () => query?.removeEventListener?.('change', onChange);
};

const PlayIcon = ({ playing }: { playing: boolean }) => (
  <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
    <path
      fill="currentColor"
      d={playing ? 'M6 5h4v14H6zm8 0h4v14h-4z' : 'M8 5.14v13.72L19 12z'}
    />
  </svg>
);

// Front page: one photo, large, with its caption. ←/→ (buttons or keys) step
// through the rest in the order given (shuffled per visit, so it starts on a
// random photo), advancing on its own as a slideshow until paused. Clicking
// the photo opens it in the lightbox on its album/category page.
export const FeaturedPhoto = ({ photos }: { photos: FeaturedPhotoData[] }) => {
  const [index, setIndex] = useState(0);
  // Fade in photos after the first, which shows immediately (it's the LCP).
  const [stepped, setStepped] = useState(false);
  // Plays on arrival, except for viewers who've asked for reduced motion;
  // after that, whatever they choose with the play/pause button.
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    prefersReducedMotion,
    () => false,
  );
  const [choice, setChoice] = useState<boolean | null>(null);
  const playing = choice ?? !reducedMotion;
  const count = photos.length;
  const photo = photos[index];

  const step = useCallback(
    (by: number) => {
      setStepped(true);
      setIndex((i) => (i + by + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [step]);

  // Slideshow: next photo after SLIDE_MS. The count restarts whenever the
  // photo changes (so ←/→ give the new photo its full time) and waits while
  // the tab is hidden.
  useEffect(() => {
    if (!playing || count < 2) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const restart = () => {
      clearTimeout(timer);
      if (!document.hidden) timer = setTimeout(() => step(1), SLIDE_MS);
    };
    restart();
    document.addEventListener('visibilitychange', restart);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', restart);
    };
  }, [playing, index, count, step]);

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
            className={`mx-auto h-auto max-h-[70vh] w-auto max-w-full ${
              stepped ? 'motion-safe:animate-[fade-in_400ms_ease-out]' : ''
            }`}
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
            <button
              type="button"
              aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
              onClick={() => setChoice(!playing)}
              className="absolute bottom-2 right-2 rounded-full bg-black/40 p-2 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
            >
              <PlayIcon playing={playing} />
            </button>
          </>
        )}
      </div>
      {(photo.title || photo.caption || photo.date) && (
        <figcaption className="mt-3 max-w-prose space-y-1">
          {photo.title && (
            <p className="text-sm text-gray-200">{photo.title}</p>
          )}
          {photo.caption && (
            <p className="whitespace-pre-line text-[13px] text-gray-400">
              {photo.caption}
            </p>
          )}
          {photo.date && <p className="text-xs text-gray-400">{photo.date}</p>}
        </figcaption>
      )}
    </figure>
  );
};
