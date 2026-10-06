import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isPublishedPhoto } from '@/lib/published';
import { GET } from '../route';

vi.mock('@/lib/published', () => ({ isPublishedPhoto: vi.fn() }));

const mockFetch = vi.fn();
const get = (path: string) =>
  GET(new Request(`http://localhost/flickr/${path}`), {
    params: Promise.resolve({ path: path.split('/') }),
  });

describe('/flickr/[...path]', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.mocked(isPublishedPhoto).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('serves published photos, cached for a day and tagged for purging', async () => {
    mockFetch.mockResolvedValue(
      new Response('jpeg bytes', { headers: { 'Content-Type': 'image/jpeg' } }),
    );
    const res = await get('65535/54930726586_abd52c470f_h.jpg');
    expect(isPublishedPhoto).toHaveBeenCalledWith('54930726586');
    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://live.staticflickr.com/65535/54930726586_abd52c470f_h.jpg',
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
    expect(res.headers.get('Vercel-CDN-Cache-Control')).toBe('max-age=86400');
    expect(res.headers.get('Vercel-Cache-Tag')).toBe(
      'flickr-54930726586,flickr',
    );
    expect(await res.text()).toBe('jpeg bytes');
  });

  it('refuses anything that is not a Flickr photo file', async () => {
    for (const path of [
      '../etc/passwd',
      '65535/notaphoto.html',
      'evil.com/1_abc.jpg',
      '65535/123_abc_h.jpg/extra',
    ]) {
      expect((await get(path)).status).toBe(404);
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refuses photos that aren't on the site (anyone else's, or removed)", async () => {
    vi.mocked(isPublishedPhoto).mockResolvedValue(false);
    const res = await get('65535/999_abc_b.jpg');
    expect(res.status).toBe(404);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("doesn't cache errors", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 503 }));
    const busy = await get('65535/1_abc.jpg');
    expect(busy.status).toBe(502);
    expect(busy.headers.get('Cache-Control')).toBe('no-store');

    mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect((await get('65535/2_abc.jpg')).status).toBe(404);

    vi.mocked(isPublishedPhoto).mockRejectedValueOnce(new Error('Flickr down'));
    const down = await get('65535/3_abc.jpg');
    expect(down.status).toBe(502);
    expect(down.headers.get('Cache-Control')).toBe('no-store');
  });
});
