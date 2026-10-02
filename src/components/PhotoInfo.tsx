import { decodeHTML } from 'entities';
import { FlickrPhoto, PhotoExif } from '@/types/flickr';

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

const formatDate = (photo: FlickrPhoto) => {
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

// Flickr descriptions are HTML (links, <br>, entities); show them as plain
// text with line breaks kept, never as markup. Tags are stripped before
// decoding, so an encoded "&lt;b&gt;" stays visible text rather than a tag.
export const plainCaption = (html = '') =>
  decodeHTML(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''))
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// Pixelpost-style: quiet lines of text rather than a labeled grid.
const settingsLine = (exif: PhotoExif) =>
  [
    exif.focalLength,
    exif.exposureTime,
    exif.aperture,
    exif.iso && `ISO ${exif.iso}`,
    exif.exposureBias,
  ].filter((value): value is string => Boolean(value));

const gearLine = (exif: PhotoExif) =>
  [exif.camera, exif.lens].filter(Boolean).join(' · ');

// `exif` is undefined while loading and null when Flickr has none to share;
// either way those lines are simply left out.
export const PhotoInfo = ({
  photo,
  exif,
}: {
  photo: FlickrPhoto;
  exif?: PhotoExif | null;
}) => {
  const title = displayTitle(photo.title);
  const caption = plainCaption(photo.description?._content);
  const date = formatDate(photo);
  const tags = visibleTags(photo.tags);
  const settings = exif ? settingsLine(exif) : [];
  const gear = exif ? gearLine(exif) : '';

  return (
    <div className="space-y-5 text-xs leading-relaxed text-gray-400">
      {(title || caption) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-sm font-medium text-gray-100">{title}</h2>
          )}
          {caption && (
            <p className="whitespace-pre-line text-[13px] text-gray-300">
              {caption}
            </p>
          )}
        </div>
      )}
      {(date || settings.length > 0 || gear) && (
        <div>
          {date && (
            <p>
              <time dateTime={photo.datetaken}>{date}</time>
            </p>
          )}
          {settings.length > 0 && (
            <p className="text-gray-300">
              {settings.map((value, i) => (
                // Wrap between values, never inside one ("-1 EV").
                <span key={value} className="whitespace-nowrap">
                  {i > 0 && ' · '}
                  {value}
                </span>
              ))}
            </p>
          )}
          {gear && <p>{gear}</p>}
        </div>
      )}
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-x-2.5 gap-y-0.5">
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
      <a
        href={`https://www.flickr.com/photo.gne?id=${photo.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-gray-400 underline-offset-2 transition-colors hover:text-gray-100 hover:underline"
      >
        View on Flickr ↗
      </a>
    </div>
  );
};
