import { Photo } from '@/types/flickr';

// Curation tags (e.g. the "gallery" tag that puts photos on the site) and
// machine tags like "uploaded:by=instagram" aren't interesting to viewers.
const HIDDEN_TAGS = new Set(['gallery']);

export const visibleTags = (tags = '') =>
  tags
    .split(' ')
    .filter((tag) => tag && !HIDDEN_TAGS.has(tag) && !/[:=]/.test(tag));

// Lightroom often publishes the file name as the title; don't show those.
export const displayTitle = (title: string) =>
  /\.(jpe?g|png|tiff?|heic|dng)$/i.test(title.trim()) ? '' : title.trim();

const formatDate = (photo: Photo) => {
  if (!photo.datetaken || Number(photo.datetakenunknown)) return '';
  // Flickr's taken date is camera local time with no zone; format it as-is.
  const date = new Date(`${photo.datetaken.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
};

export const PhotoInfo = ({ photo }: { photo: Photo }) => {
  const title = displayTitle(photo.title);
  const date = formatDate(photo);
  const { camera, lens, ...exposure } = photo.exif ?? {};
  const settings = [
    exposure.exposureTime,
    exposure.aperture,
    exposure.iso,
    exposure.focalLength,
    exposure.exposureBias,
  ].filter(Boolean);
  const gear = [camera, lens].filter(Boolean);
  const tags = visibleTags(photo.tags);

  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-4 pt-12 text-sm text-gray-300 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-1.5">
        {(title || date) && (
          <p className="text-gray-100">
            {title && <span className="font-medium">{title}</span>}
            {title && date && <span className="text-gray-500"> · </span>}
            {date && <time dateTime={photo.datetaken}>{date}</time>}
          </p>
        )}
        {settings.length > 0 && (
          <p className="font-mono text-xs tracking-wide">
            {settings.join('  ·  ')}
          </p>
        )}
        {gear.length > 0 && (
          <p className="text-xs text-gray-400">{gear.join(' · ')}</p>
        )}
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
