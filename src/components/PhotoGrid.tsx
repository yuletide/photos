'use client';

import Image from 'next/image';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from 'react';
import Lightbox, {
  ErrorIcon,
  IconButton,
  ImageSlide,
  LoadingIcon,
  createIcon,
  useLightboxProps,
  useLightboxState,
  type RenderSlideProps,
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

// Flickr's CDN can refuse large images (429 when requests come in bursts,
// and on some iOS Safari + Private Relay setups). If a slide's image fails,
// show the 500px version right away (already cached from the grid), then
// upgrade in the background: 1024px first, then 2048px (or 1600px), each with
// 1s/2s/4s backoff. No broken-image icon while that happens.
const RETRY_DELAYS = [1000, 2000, 4000];
// 1024px first (quick, usually allowed), then the full-resolution sizes.
const UPGRADE_SIZES = ['l', 'k', 'h'] as const;

const sizedSlide = (
  photo: FlickrPhoto,
  size: 'm' | 'l' | 'h' | 'k',
  alt?: string,
): SlideImage | undefined => {
  const src = photo[`url_${size}`];
  return src
    ? {
        src,
        width: Number(photo[`width_${size}`]),
        height: Number(photo[`height_${size}`]),
        alt,
        photo,
      }
    : undefined;
};

// Resolves true once `src` loads, retrying with backoff; false if it never does.
export const loadWithRetry = (
  src: string,
  cancelled: () => boolean,
  onRetry: () => void = () => {},
) =>
  new Promise<boolean>((resolve) => {
    let attempt = 0;
    const tryOnce = () => {
      if (cancelled()) return resolve(false);
      const img = new window.Image(); // not next/image's Image
      img.onload = () => resolve(true);
      img.onerror = () => {
        if (attempt >= RETRY_DELAYS.length) return resolve(false);
        onRetry();
        setTimeout(tryOnce, RETRY_DELAYS[attempt++]);
      };
      img.src = src;
    };
    tryOnce();
  });

const RetryingSlide = ({
  slide,
  offset,
  rect,
  onCurrentLoad,
}: RenderSlideProps & { onCurrentLoad: () => void }) => {
  const { carousel } = useLightboxProps();
  const photo = 'photo' in slide ? slide.photo : undefined;
  const [failed, setFailed] = useState(false);
  const [terminalFailure, setTerminalFailure] = useState(false);
  const [upgraded, setUpgraded] = useState<SlideImage>();
  // For the ?debug badge: what's on screen and how the upgrade is going.
  const [loadedSrc, setLoadedSrc] = useState('');
  const [retries, setRetries] = useState(0);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!failed || !photo) return;
    let cancelled = false;
    (async () => {
      setUpgrading(true);
      let upgradedAny = false;
      for (const size of UPGRADE_SIZES) {
        const candidate = sizedSlide(photo, size, slide.alt);
        if (
          candidate &&
          (await loadWithRetry(
            candidate.src,
            () => cancelled,
            () => setRetries((n) => n + 1),
          ))
        ) {
          if (cancelled) return;
          upgradedAny = true;
          setUpgraded(candidate);
          if (size !== 'l') break; // Full resolution: done.
        }
      }
      if (!cancelled) {
        setTerminalFailure(!upgradedAny);
        setUpgrading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [failed, photo, slide.alt]);

  if (!photo) return undefined;
  const shown =
    upgraded ?? (failed ? (sizedSlide(photo, 'm', slide.alt) ?? slide) : slide);

  return (
    <>
      <ImageSlide
        key={shown.src}
        slide={shown}
        offset={offset}
        rect={rect}
        imageFit={carousel.imageFit}
        imageProps={carousel.imageProps}
        render={{
          iconError: () =>
            terminalFailure ? (
              <ErrorIcon className="yarl__icon yarl__slide_error" />
            ) : (
              <LoadingIcon className="yarl__icon yarl__slide_loading" />
            ),
        }}
        onLoad={(img) => {
          setLoadedSrc(img.currentSrc || img.src);
          if (offset === 0) onCurrentLoad();
        }}
        onError={() => setFailed(true)}
      />
      {offset === 0 && showDebug() && (
        <DebugBadge
          src={loadedSrc}
          failed={failed}
          upgrading={upgrading}
          retries={retries}
        />
      )}
    </>
  );
};

// Add ?debug to the URL to see which Flickr size the lightbox is showing and
// whether it had to fall back or retry. Handy for checking on a phone.
const showDebug = () => {
  try {
    return new URLSearchParams(window.location.search).has('debug');
  } catch {
    return false;
  }
};

const SIZE_LABELS: Record<string, string> = {
  k: '2048px',
  h: '1600px',
  b: '1024px',
};

export const sizeLabel = (src: string) => {
  const suffix = src.match(/_([a-z])\.jpg$/)?.[1];
  if (!src) return 'loading';
  return (suffix && SIZE_LABELS[suffix]) ?? '500px';
};

const DebugBadge = ({
  src,
  failed,
  upgrading,
  retries,
}: {
  src: string;
  failed: boolean;
  upgrading: boolean;
  retries: number;
}) => (
  <div className="pointer-events-none absolute left-3 top-3 z-10 rounded bg-black/70 px-2 py-1 font-mono text-[11px] text-white">
    {[
      sizeLabel(src),
      failed && 'fallback',
      upgrading && 'upgrading…',
      retries > 0 && `${retries} retr${retries === 1 ? 'y' : 'ies'}`,
    ]
      .filter(Boolean)
      .join(' · ')}
  </div>
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
// photo. If it was closed with the mouse or a tap, hide the ring until the
// viewer navigates by keyboard again; keyboard closes keep it.
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

// The open photo lives in the URL (?photo=<id>), so every photo has a link
// that can be shared or bookmarked, and the back button closes the lightbox.
const PHOTO_PARAM = 'photo';
const urlListeners = new Set<() => void>();

const subscribeToUrl = (listener: () => void) => {
  urlListeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    urlListeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
};

const readPhotoParam = () =>
  new URLSearchParams(window.location.search).get(PHOTO_PARAM);

const writePhotoParam = (photoId: string | null, mode: 'push' | 'replace') => {
  const url = new URL(window.location.href);
  if (photoId) url.searchParams.set(PHOTO_PARAM, photoId);
  else url.searchParams.delete(PHOTO_PARAM);
  if (url.href === window.location.href) return;
  // Next.js supports the native History API and keeps its router in sync.
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
  urlListeners.forEach((listener) => listener());
};

// Let cmd/ctrl/shift-click and middle-click open the image in a new tab.
const isPlainClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export const PhotoGrid = ({ photos }: { photos: FlickrPhoto[] }) => {
  // Whether the photo on screen has loaded; neighbors preload only after.
  const [currentLoaded, setCurrentLoaded] = useState(false);
  const shown = photos.filter((photo) => photo.url_m);
  // The server (and first client render) never has a photo open.
  const photoId = useSyncExternalStore(
    subscribeToUrl,
    readPhotoParam,
    () => null,
  );
  const index = photoId ? shown.findIndex((p) => p.id === photoId) : -1;
  const open = index >= 0;
  // How the viewer last interacted, to decide whether to hide the focus ring.
  const lastInput = useRef<'pointer' | 'keyboard'>('pointer');

  useEffect(() => {
    if (!open) return;
    const onPointer = () => (lastInput.current = 'pointer');
    const onKey = () => (lastInput.current = 'keyboard');
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  // Whether we added the history entry for the open photo; if so, closing
  // goes back to it rather than piling up entries.
  const pushedEntry = useRef(false);

  const openPhoto = (photo: FlickrPhoto) => {
    setCurrentLoaded(false);
    pushedEntry.current = true;
    writePhotoParam(photo.id, 'push');
  };

  const close = () => {
    if (pushedEntry.current) {
      pushedEntry.current = false;
      window.history.back();
    } else {
      writePhotoParam(null, 'replace');
    }
  };

  // null = follow the viewer's saved preference.
  const [infoChoice, setInfoChoice] = useState<boolean | null>(null);
  const showInfo = open && (infoChoice ?? readInfoPref());

  const toggleInfo = () =>
    setInfoChoice((choice) => {
      const next = !(choice ?? readInfoPref());
      writeInfoPref(next);
      return next;
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
              openPhoto(photo);
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
        close={close}
        slides={shown.map(toSlide)}
        on={{
          view: ({ index: viewed }) =>
            shown[viewed] && writePhotoParam(shown[viewed].id, 'replace'),
          exited: () => {
            if (lastInput.current === 'pointer')
              requestAnimationFrame(hideRestoredFocusRing);
          },
        }}
        // Load the current photo first; neighbors only once it has arrived,
        // so large images aren't all requested at once.
        carousel={{ preload: currentLoaded ? 2 : 0 }}
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
        render={{
          controls: () => (showInfo ? <InfoPanel /> : null),
          slide: (props) => (
            <RetryingSlide
              key={props.slide.src}
              {...props}
              onCurrentLoad={() => setCurrentLoaded(true)}
            />
          ),
        }}
      />
    </>
  );
};
