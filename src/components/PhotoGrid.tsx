'use client';

import Image from 'next/image';
import { useEffect, useState, type MouseEvent } from 'react';
import Lightbox, {
  IconButton,
  createIcon,
  type SlideImage,
} from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { PhotoInfo } from '@/components/PhotoInfo';
import { Photo } from '@/types/flickr';

declare module 'yet-another-react-lightbox' {
  interface SlideImage {
    photo?: Photo;
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
const sources = (photo: Photo) =>
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

const toSlide = (photo: Photo): SlideImage => {
  const srcSet = sources(photo);
  return { ...srcSet[srcSet.length - 1], alt: photo.title, srcSet, photo };
};

const InfoIcon = createIcon(
  'Info',
  <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />,
);

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

// Let cmd/ctrl/shift-click and middle-click open the image in a new tab.
const isPlainClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export const PhotoGrid = ({ photos }: { photos: Photo[] }) => {
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
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
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
        render={{
          slideFooter: ({ slide }) =>
            showInfo && 'photo' in slide && slide.photo ? (
              <PhotoInfo photo={slide.photo} />
            ) : null,
        }}
      />
    </>
  );
};
