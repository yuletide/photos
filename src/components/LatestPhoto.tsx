import Link from 'next/link';
import { displayTitle, formatDate, plainCaption } from '@/components/PhotoInfo';
import { PublishedPhoto } from '@/lib/published';
import { FlickrPhoto } from '@/types/flickr';

const SIZES = ['m', 'l', 'h', 'k'] as const;

// Flickr's pre-sized JPEGs as a srcset, so phones don't fetch the 2048px one.
const srcSet = (photo: FlickrPhoto) =>
  SIZES.flatMap((size) => {
    const src = photo[`url_${size}`];
    return src ? [`${src} ${photo[`width_${size}`]}w`] : [];
  }).join(', ');

// The rendered width is the smaller of the page width (100vw minus main's
// 2rem padding) and 75vh x the photo's aspect ratio (the height cap). The
// height cap binds once the viewport is wider than 0.75 x ratio, so express
// that as an aspect-ratio media condition the browser can use to pick a size.
export const imageSizes = (photo: FlickrPhoto) => {
  const ratio = Number(photo.width_m) / Number(photo.height_m) || 1;
  const switchAt = Math.round(0.75 * ratio * 1000);
  return `(max-aspect-ratio: ${switchAt}/1000) calc(100vw - 2rem), calc(75vh * ${ratio.toFixed(3)})`;
};

// Pixelpost-style front page: the newest photo, large, with its caption.
// Clicking it opens the photo in the lightbox on its album/category page.
export const LatestPhoto = ({ latest }: { latest: PublishedPhoto }) => {
  const { photo, href } = latest;
  const title = displayTitle(photo.title);
  const caption = plainCaption(photo.description?._content);
  const date = formatDate(photo);

  return (
    <figure className="mx-auto mb-16 w-fit max-w-full">
      <Link href={`${href}?photo=${photo.id}`} className="block">
        {/* Flickr serves pre-sized JPEGs; next/image optimization is off. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url_m}
          srcSet={srcSet(photo)}
          sizes={imageSizes(photo)}
          width={photo.width_m}
          height={photo.height_m}
          // The link's only content, so it names the link: never a file name.
          alt={title || caption.split('\n')[0] || 'Latest photo'}
          fetchPriority="high"
          className="mx-auto h-auto max-h-[75vh] w-auto max-w-full"
        />
      </Link>
      {(title || caption || date) && (
        <figcaption className="mt-3 max-w-prose space-y-1 text-xs text-gray-500">
          {title && <p className="text-sm text-gray-200">{title}</p>}
          {caption && (
            <p className="whitespace-pre-line text-[13px] text-gray-400">
              {caption}
            </p>
          )}
          {date && <p>{date}</p>}
        </figcaption>
      )}
    </figure>
  );
};
