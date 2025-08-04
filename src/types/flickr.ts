export interface FlickrPhoto {
  id: string;
  secret: string;
  server: string;
  farm: number;
  title: string;
  isprimary: string;
  url_o?: string; // Original photo URL
  height_o?: number;
  width_o?: number;
  url_l?: string; // Large photo URL
  height_l?: number;
  width_l?: number;
  url_m?: string; // Medium photo URL
  height_m?: number;
  width_m?: number;
  description?: {
    _content: string;
  };
}

export interface FlickrPhotoset {
  id: string;
  primary: string;
  secret: string;
  server: string;
  farm: number;
  photos: number;
  videos: number;
  title: {
    _content: string;
  };
  description: {
    _content: string;
  };
  primary_photo_extras?: {
    url_m: string;
    height_m: string;
    width_m: string;
  };
}

export interface FlickrPhotosetPhotosResponse {
  photoset: {
    id: string;
    primary: string;
    owner: string;
    ownername: string;
    photo: FlickrPhoto[];
    page: number;
    per_page: number;
    perpage: number;
    pages: number;
    title: string;
    total: number;
  };
  stat: string;
}

export interface FlickrPhotosetsResponse {
  photosets: {
    page: number;
    pages: number;
    perpage: number;
    total: number;
    photoset: FlickrPhotoset[];
  };
  stat: string;
}
