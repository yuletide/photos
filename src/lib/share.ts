import type { Metadata } from 'next';
import { FlickrPhoto } from '@/types/flickr';

export const SITE_NAME = 'Alex Yule Photos';
export const SITE_URL = 'https://photos.alexyule.com';

type ImageSource = {
  url_m?: string;
  width_m?: number;
  height_m?: number;
  url_l?: string;
  width_l?: number;
  height_l?: number;
  url_h?: string;
  width_h?: number;
  height_h?: number;
};

// The best Flickr size for a link preview: 1600px if available, else 1024px,
// else 500px. Previews are cropped by each app, so bigger is safer.
export const previewImage = (photo?: ImageSource) => {
  for (const size of ['h', 'l', 'm'] as const) {
    const url = photo?.[`url_${size}`];
    if (url) {
      return {
        url,
        width: Number(photo?.[`width_${size}`]) || undefined,
        height: Number(photo?.[`height_${size}`]) || undefined,
      };
    }
  }
  return undefined;
};

// Open Graph + Twitter tags for a page. Next replaces (not merges) `openGraph`
// per page, so the shared fields live here.
export const shareMetadata = ({
  title,
  description,
  path,
  image,
}: {
  title?: string;
  description: string;
  path: string;
  image?: FlickrPhoto | ImageSource;
}): Metadata => {
  const preview = previewImage(image);
  return {
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: title ?? SITE_NAME,
      description,
      url: path,
      images: preview ? [preview] : undefined,
    },
    twitter: {
      card: preview ? 'summary_large_image' : 'summary',
      title: title ?? SITE_NAME,
      description,
      images: preview ? [preview.url] : undefined,
    },
  };
};
