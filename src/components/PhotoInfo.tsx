import { decodeHTML } from 'entities';
import { FlickrPhoto, PhotoExif } from '@/types/flickr';

// Curation tags (e.g. the "gallery" tag that puts photos on the site) and
// machine tags like "uploaded:by=instagram" aren't interesting to viewers.
const HIDDEN_TAGS = new Set(['gallery']);

export const visibleTags = (tags = '') =>
  tags
    .split(' ')
    .filter((tag) => tag && !HIDDEN_TAGS.has(tag) && !/[:=]/.test(tag));

// Lightroom often publishes the file name as the title ("20230821-P8210388",
// "20070831_MG_4415.jpg"); don't show those. A title with no spaces and a run
// of 6+ digits is treated as a file name.
const looksLikeFileName = (title: string) =>
  /\.(jpe?g|png|tiff?|heic|dng)$/i.test(title) ||
  (!/\s/.test(title) && /\d{6,}/.test(title));

export const displayTitle = (title: string) =>
  looksLikeFileName(title.trim()) ? '' : title.trim();

// Flickr descriptions are HTML (links, <br>, entities); show them as plain
// text with line breaks kept, never as markup. Tags are stripped before
// decoding, so an encoded "&lt;b&gt;" stays visible text rather than a tag.
export const plainCaption = (html = '') =>
  decodeHTML(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''))
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const formatDate = (photo: FlickrPhoto) => {
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

const EXPOSURE: [keyof PhotoExif, string][] = [
  ['exposureTime', 'Shutter'],
  ['aperture', 'Aperture'],
  ['iso', 'ISO'],
  ['focalLength', 'Focal length'],
  ['exposureBias', 'Exposure comp.'],
];

const GEAR: [keyof PhotoExif, string][] = [
  ['camera', 'Camera'],
  ['lens', 'Lens'],
];

const Label = ({ children }: { children: string }) => (
  <dt className="text-[10px] uppercase tracking-widest text-gray-400">
    {children}
  </dt>
);

const Fields = ({
  exif,
  fields,
  mono,
}: {
  exif: PhotoExif;
  fields: [keyof PhotoExif, string][];
  mono?: boolean;
}) => {
  const present = fields.filter(([key]) => exif[key]);
  if (present.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {present.map(([key, label]) => (
        <div key={key} className={mono ? '' : 'col-span-2'}>
          <Label>{label}</Label>
          <dd
            className={`mt-0.5 text-gray-200 ${mono ? 'font-mono text-sm' : 'text-sm'}`}
          >
            {exif[key]}
          </dd>
        </div>
      ))}
    </dl>
  );
};

// `exif` is undefined while loading and null when Flickr has none to share;
// either way those sections are simply left out.
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

  return (
    <div className="space-y-6 text-sm">
      {(title || caption || date) && (
        <header className="space-y-1">
          {title && (
            <h2 className="text-lg font-light leading-snug text-white">
              {title}
            </h2>
          )}
          {caption && (
            <p className="whitespace-pre-line pb-1 text-sm leading-relaxed text-gray-300">
              {caption}
            </p>
          )}
          {date && (
            <time
              dateTime={photo.datetaken}
              className="block text-[10px] uppercase tracking-widest text-gray-400"
            >
              {date}
            </time>
          )}
        </header>
      )}
      {exif && <Fields exif={exif} fields={EXPOSURE} mono />}
      {exif && <Fields exif={exif} fields={GEAR} />}
      {tags.length > 0 && (
        <div>
          <Label>Tags</Label>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-gray-400">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      )}
      <a
        href={`https://www.flickr.com/photo.gne?id=${photo.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs text-gray-400 transition-colors hover:text-white"
      >
        View on Flickr ↗
      </a>
    </div>
  );
};
