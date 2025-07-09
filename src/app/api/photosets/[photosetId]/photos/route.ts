import { createFlickr } from 'flickr-sdk';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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

export async function GET(
  request: Request,
  { params }: { params: { photosetId: string } },
) {
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

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
