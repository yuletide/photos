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

export async function GET() {
  try {
    const res = await flickr('flickr.photosets.getList', {
      user_id: USER_ID,
      primary_photo_extras: 'url_m',
    });
    return NextResponse.json(res.photosets.photoset);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch photosets' },
      { status: 500 },
    );
  }
}
