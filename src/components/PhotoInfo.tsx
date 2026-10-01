import { Photo, PhotoExif } from '@/types/flickr';

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
  <dt className="text-[10px] uppercase tracking-widest text-gray-500">
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

export const PhotoInfo = ({ photo }: { photo: Photo }) => {
  const title = displayTitle(photo.title);
  const date = formatDate(photo);
  const exif = photo.exif ?? {};
  const tags = visibleTags(photo.tags);

  return (
    <div className="space-y-6 text-sm">
      {(title || date) && (
        <header className="space-y-1">
          {title && (
            <h2 className="text-lg font-light leading-snug text-white">
              {title}
            </h2>
          )}
          {date && (
            <time
              dateTime={photo.datetaken}
              className="block text-[10px] uppercase tracking-widest text-gray-500"
            >
              {date}
            </time>
          )}
        </header>
      )}
      <Fields exif={exif} fields={EXPOSURE} mono />
      <Fields exif={exif} fields={GEAR} />
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
        className="inline-block text-xs text-gray-500 transition-colors hover:text-white"
      >
        View on Flickr ↗
      </a>
    </div>
  );
};
