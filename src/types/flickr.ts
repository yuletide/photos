// Shapes of the Flickr REST responses we use (format=json&nojsoncallback=1).

export interface FlickrPhoto {
  id: string;
  secret: string;
  server: string;
  title: string;
  description?: { _content: string };
  url_m?: string; // Medium, 500px on longest side
  height_m?: number;
  width_m?: number;
  url_l?: string; // Large, 1024px on longest side
  height_l?: number;
  width_l?: number;
  url_h?: string; // Large, 1600px on longest side
  height_h?: number;
  width_h?: number;
  url_k?: string; // Large, 2048px on longest side
  height_k?: number;
  width_k?: number;
  tags?: string; // Space-separated, normalized Flickr tags
  datetaken?: string; // "YYYY-MM-DD HH:MM:SS", camera local time
  datetakenunknown?: string | number; // 1 when Flickr has no taken date
}

// The handful of EXIF fields shown in the lightbox, already formatted.
export interface PhotoExif {
  camera?: string;
  lens?: string;
  exposureTime?: string;
  aperture?: string;
  iso?: string;
  focalLength?: string;
  exposureBias?: string;
}

export interface FlickrPhotoset {
  id: string;
  primary: string;
  count_photos: number;
  title: { _content: string };
  description: { _content: string };
  primary_photo_extras?: {
    url_m: string;
    height_m: number;
    width_m: number;
    url_l?: string;
    height_l?: number;
    width_l?: number;
  };
}

export interface FlickrPhotosetPhotosResponse {
  photoset: {
    id: string;
    owner: string;
    photo: FlickrPhoto[];
    title: string;
    page: number;
    pages: number;
    total: number;
  };
  stat: 'ok';
}

export interface FlickrPhotosetsResponse {
  photosets: {
    page: number;
    pages: number;
    total: number;
    photoset: FlickrPhotoset[];
  };
  stat: 'ok';
}

export interface FlickrPhotosSearchResponse {
  photos: {
    page: number;
    pages: number;
    total: number;
    photo: FlickrPhoto[];
  };
  stat: 'ok';
}

export interface FlickrExifResponse {
  photo: {
    id: string;
    camera?: string;
    exif: {
      tagspace: string;
      tag: string;
      label: string;
      raw: { _content: string };
      clean?: { _content: string };
    }[];
  };
  stat: 'ok';
}
