'use client';

import Image from 'next/image';
import { useEffect, useState, type MouseEvent } from 'react';
import Lightbox, {
  IconButton,
  createIcon,
  useLightboxState,
  type SlideImage,
} from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { PhotoInfo } from '@/components/PhotoInfo';
import { FlickrPhoto, PhotoExif } from '@/types/flickr';

declare module 'yet-another-react-lightbox' {
  interface SlideImage {
    photo?: FlickrPhoto;
  }
  interface Labels {
    'Show info (i)'?: string;
    'Hide info (i)'?: string;
  }
}

// Images above the fold load eagerly to keep LCP fast.
const EAGER_COUNT = 6;

const SIZES = ['m', 'l', 'h', 'k'] as const;

// Every size Flickr returned for a photo, smallest first.
const sources = (photo: FlickrPhoto) =>
  SIZES.flatMap((size) => {
    const src = photo[`url_${size}`];
    return src
      ? [
          {
            src,
            width: Number(photo[`width_${size}`]),
            height: Number(photo[`height_${size}`]),
          },
        ]
      : [];
  });

const toSlide = (photo: FlickrPhoto): SlideImage => {
  const srcSet = sources(photo);
  return { ...srcSet[srcSet.length - 1], alt: photo.title, srcSet, photo };
};

const InfoIcon = createIcon(
  'Info',
  <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />,
);

// EXIF is fetched when a photo's info is first shown, then kept for the
// rest of the visit. Failed requests aren't kept, so they're retried.
const exifRequests = new Map<string, Promise<PhotoExif | null>>();

const loadExif = (photoId: string) => {
  let request = exifRequests.get(photoId);
  if (!request) {
    request = fetch(`/api/photos/${photoId}/exif`).then((res) => {
      if (!res.ok) throw new Error(`EXIF request failed: ${res.status}`);
      return res.json() as Promise<PhotoExif | null>;
    });
    request.catch(() => exifRequests.delete(photoId));
    exifRequests.set(photoId, request);
  }
  return request;
};

// undefined while loading, null when there's nothing to show.
const useExif = (photoId: string) => {
  const [loaded, setLoaded] = useState<{
    id: string;
    exif: PhotoExif | null;
  }>();
  useEffect(() => {
    let current = true;
    loadExif(photoId)
      .catch(() => null)
      .then((exif) => current && setLoaded({ id: photoId, exif }));
    return () => {
      current = false;
    };
  }, [photoId]);
  return loaded?.id === photoId ? loaded.exif : undefined;
};

const InfoPanelContent = ({ photo }: { photo: FlickrPhoto }) => (
  <PhotoInfo photo={photo} exif={useExif(photo.id)} />
);

// Info for the current slide: a right-hand column on wide screens (the photo
// shrinks to make room, see globals.css) and a bottom sheet on phones.
const InfoPanel = () => {
  const { currentSlide } = useLightboxState();
  const photo = currentSlide && 'photo' in currentSlide && currentSlide.photo;
  if (!photo) return null;
  return (
    <aside className="absolute inset-x-0 bottom-0 h-[45dvh] overflow-y-auto border-t border-white/10 bg-neutral-950 p-5 md:inset-y-0 md:left-auto md:h-auto md:w-72 md:border-l md:border-t-0 md:px-6 md:pt-20">
      <InfoPanelContent photo={photo} />
    </aside>
  );
};

// Whether the info panel is open, remembered per viewer across visits.
const INFO_KEY = 'photo-info';

const readInfoPref = () => {
  try {
    return localStorage.getItem(INFO_KEY) === '1';
  } catch {
    return false;
  }
};

const writeInfoPref = (show: boolean) => {
  try {
    localStorage.setItem(INFO_KEY, show ? '1' : '0');
  } catch {
    // Storage blocked (private mode etc.): the toggle still works this visit.
  }
};

// When the lightbox closes it returns focus to the photo that opened it (so
// Tab continues from there), and Chrome then draws its focus ring around that
// photo. Hide the ring until the viewer actually navigates by keyboard again.
const hideRestoredFocusRing = () => {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || !el.closest('[data-photo-grid]')) return;
  el.dataset.focusRestored = '';
  const reveal = (e: Event) => {
    if (e instanceof KeyboardEvent && e.key !== 'Tab') return;
    delete el.dataset.focusRestored;
    document.removeEventListener('keydown', reveal, true);
    el.removeEventListener('blur', reveal);
  };
  document.addEventListener('keydown', reveal, true);
  el.addEventListener('blur', reveal);
};

// Let cmd/ctrl/shift-click and middle-click open the image in a new tab.
const isPlainClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export const PhotoGrid = ({ photos }: { photos: FlickrPhoto[] }) => {
  const [index, setIndex] = useState(-1);
  const [showInfo, setShowInfo] = useState(false);
  const shown = photos.filter((photo) => photo.url_m);
  const open = index >= 0;

  const toggleInfo = () =>
    setShowInfo((show) => {
      writeInfoPref(!show);
      return !show;
    });

  // "i" toggles the info panel while the lightbox is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'i' || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      toggleInfo();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <div
        data-photo-grid
        className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4"
      >
        {shown.map((photo, i) => (
          <a
            key={photo.id}
            href={toSlide(photo).src}
            onClick={(e) => {
              if (!isPlainClick(e)) return;
              e.preventDefault();
              setShowInfo(readInfoPref());
              setIndex(i);
            }}
            className="block break-inside-avoid hover:opacity-80 transition-opacity"
          >
            <Image
              src={photo.url_m!}
              alt={photo.title}
              width={photo.width_m}
              height={photo.height_m}
              loading={i < EAGER_COUNT ? 'eager' : 'lazy'}
              className="w-full h-auto"
            />
          </a>
        ))}
      </div>
      <Lightbox
        open={open}
        index={index}
        close={() => setIndex(-1)}
        on={{ exited: () => requestAnimationFrame(hideRestoredFocusRing) }}
        slides={shown.map(toSlide)}
        toolbar={{
          buttons: [
            <IconButton
              key="info"
              label={showInfo ? 'Hide info (i)' : 'Show info (i)'}
              aria-pressed={showInfo}
              icon={InfoIcon}
              onClick={toggleInfo}
            />,
            'close',
          ],
        }}
        className={showInfo ? 'photo-info-open' : undefined}
        render={{ controls: () => (showInfo ? <InfoPanel /> : null) }}
      />
    </>
  );
};
