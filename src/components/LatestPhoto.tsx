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
          sizes="(min-width: 64rem) 64rem, 100vw"
          width={photo.width_m}
          height={photo.height_m}
          alt={photo.title}
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
