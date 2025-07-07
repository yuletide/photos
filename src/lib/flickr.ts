import { unstable_cache } from "next/cache";
import {
  FlickrPhotosetPhotosResponse,
  FlickrPhotosetsResponse,
} from "@/types/flickr";

const API_KEY = process.env.FLICKR_API_KEY;
const USER_ID = process.env.FLICKR_USER_ID;
const BASE_URL = "https://api.flickr.com/services/rest/";

if (!API_KEY || !USER_ID) {
  throw new Error(
    "Flickr API key and User ID must be provided in environment variables.",
  );
}

const callFlickrApi = async <T>(params: Record<string, string>): Promise<T> => {
  const allParams = {
    ...params,
    api_key: API_KEY,
    user_id: USER_ID,
    format: "json",
    nojsoncallback: "1",
  };

  const url = new URL(BASE_URL);
  Object.entries(allParams).forEach(([key, value]) =>
    url.searchParams.append(key, value),
  );

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Flickr API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.stat !== "ok") {
    throw new Error(`Flickr API error: ${data.message}`);
  }

  return data;
};

export const getPhotoSets = unstable_cache(
  async () => {
    const data = await callFlickrApi<FlickrPhotosetsResponse>({
      method: "flickr.photosets.getList",
      primary_photo_extras: "url_m",
    });
    return data.photosets.photoset;
  },
  ["flickr-photosets"],
  { revalidate: 3600 }, // Revalidate every hour
);

export const getPhotosInSet = unstable_cache(
  async (photosetId: string) => {
    const data = await callFlickrApi<FlickrPhotosetPhotosResponse>({
      method: "flickr.photosets.getPhotos",
      photoset_id: photosetId,
      extras: "url_m,url_l,url_o,description",
    });
    return data.photoset.photo;
  },
  ["flickr-photos-in-set"],
  { revalidate: 3600 }, // Revalidate every hour
);
