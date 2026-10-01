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
