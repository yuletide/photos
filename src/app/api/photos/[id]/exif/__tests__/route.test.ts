import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getExif } from '@/lib/flickr';
import { isPublishedPhoto } from '@/lib/published';
import { GET } from '../route';

vi.mock('@/lib/flickr', () => ({ getExif: vi.fn() }));
vi.mock('@/lib/published', () => ({ isPublishedPhoto: vi.fn() }));

const get = (id: string) =>
  GET(new Request(`http://test/api/photos/${id}/exif`), {
    params: Promise.resolve({ id }),
  });

describe('GET /api/photos/[id]/exif', () => {
  beforeEach(() => {
    vi.mocked(isPublishedPhoto).mockResolvedValue(true);
    vi.mocked(getExif).mockResolvedValue({ camera: 'OM-1' });
  });

  it('returns EXIF with a long CDN cache', async () => {
    const res = await get('123');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ camera: 'OM-1' });
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=2592000');
  });

  it('caches "no EXIF" only briefly', async () => {
    vi.mocked(getExif).mockResolvedValue(undefined);
    const res = await get('123');
    expect(await res.json()).toBeNull();
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=300');
  });

  it('refuses photos that are not on the site', async () => {
    vi.mocked(isPublishedPhoto).mockResolvedValue(false);
    expect((await get('123')).status).toBe(404);
    expect((await get('not-an-id')).status).toBe(404);
    expect(getExif).not.toHaveBeenCalledWith('not-an-id');
  });

  it('does not cache failures to check the photo', async () => {
    vi.mocked(isPublishedPhoto).mockRejectedValue(new Error('Flickr down'));
    const res = await get('123');
    expect(res.status).toBe(502);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});
