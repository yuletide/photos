import { createFlickr } from 'flickr-sdk';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { filterPhotosetsByConfig } from '@/config/galleries';

const API_KEY = process.env.FLICKR_API_KEY;
const USER_ID = process.env.FLICKR_USER_ID;

if (!API_KEY || !USER_ID) {
  throw new Error(
    'Flickr API key and User ID must be provided in environment variables.',
  );
}

const { flickr } = createFlickr(API_KEY);

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('category');

  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const res = await flickr('flickr.photosets.getList', {
      user_id: USER_ID,
      primary_photo_extras: 'url_m',
    });

    const filteredPhotosets = filterPhotosetsByConfig(
      res.photosets.photoset,
      categorySlug,
    );

    return NextResponse.json(filteredPhotosets);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch photosets' },
      { status: 500 },
    );
  }
}
