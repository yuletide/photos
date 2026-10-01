'use client';

import Image from 'next/image';
import { useState, type MouseEvent } from 'react';
import Lightbox, { type SlideImage } from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { FlickrPhoto } from '@/types/flickr';

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
  return { ...srcSet[srcSet.length - 1], alt: photo.title, srcSet };
};

// Let cmd/ctrl/shift-click and middle-click open the image in a new tab.
const isPlainClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export const PhotoGrid = ({ photos }: { photos: FlickrPhoto[] }) => {
  const [index, setIndex] = useState(-1);
  const shown = photos.filter((photo) => photo.url_m);

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
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={shown.map(toSlide)}
      />
    </>
  );
};
