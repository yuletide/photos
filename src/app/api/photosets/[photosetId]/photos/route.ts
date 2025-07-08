import { createFlickr } from 'flickr-sdk';
import { NextResponse } from 'next/server';

const API_KEY = process.env.FLICKR_API_KEY;
const USER_ID = process.env.FLICKR_USER_ID;

if (!API_KEY || !USER_ID) {
  throw new Error(
    'Flickr API key and User ID must be provided in environment variables.',
  );
}

const { flickr } = createFlickr(API_KEY);

export async function GET(
  _request: Request,
  { params }: { params: { photosetId: string } },
) {
  const { photosetId } = params;

  try {
    const res = await flickr('flickr.photosets.getPhotos', {
      photoset_id: photosetId,
      user_id: USER_ID!,
      extras: 'url_m,url_l,url_o,description',
    });
    console.log(res);
    return NextResponse.json(res.photoset.photo);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: `Failed to fetch photos for photoset ${photosetId}` },
      { status: 500 },
    );
  }
}
