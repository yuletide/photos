import Image from 'next/image';
import Link from 'next/link';

interface PhotoSetType {
  id: string;
  title: {
    _content: string;
  };
  photos: number;
  primary_photo_extras?: {
    url_m: string;
    width_m: string;
    height_m: string;
  };
}
interface PhotoSetProps {
  set: PhotoSetType;
}

export const PhotoSet = ({ set }: PhotoSetProps) => {
  return (
    <div className="break-inside-avoid">
      <Link href={`/sets/${set.id}`} className="block group">
        {set.primary_photo_extras?.url_m && (
          <Image
            src={set.primary_photo_extras.url_m}
            alt={set.title._content}
            width={Number(set.primary_photo_extras.width_m)}
            height={Number(set.primary_photo_extras.height_m)}
            className="w-full h-auto rounded-lg group-hover:opacity-80 transition-opacity"
          />
        )}
        <div className="mt-2">
          <h2 className="font-medium text-gray-200 group-hover:text-white transition-colors">
            {set.title._content}
          </h2>
          <p className="text-sm text-gray-500">{set.photos} photos</p>
        </div>
      </Link>
    </div>
  );
};
