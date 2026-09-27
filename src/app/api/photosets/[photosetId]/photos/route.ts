import { createFlickr } from 'flickr-sdk';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ photosetId: string }> },
): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { photosetId } = await params;

  const API_KEY = process.env.FLICKR_API_KEY;
  const USER_ID = process.env.FLICKR_USER_ID;

  if (!API_KEY || !USER_ID) {
    return NextResponse.json(
      { error: 'Server is missing Flickr configuration' },
      { status: 500 },
    );
  }

  const { flickr } = createFlickr(API_KEY);

  try {
    const res = await flickr('flickr.photosets.getPhotos', {
      photoset_id: photosetId,
      user_id: USER_ID,
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
