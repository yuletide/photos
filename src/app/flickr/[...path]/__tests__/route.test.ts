import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';

const mockFetch = vi.fn();
const get = (path: string) =>
  GET(new Request(`http://localhost/flickr/${path}`), {
    params: Promise.resolve({ path: path.split('/') }),
  });

describe('/flickr/[...path]', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('serves Flickr photo files, cached for a year', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(
      new Response('jpeg bytes', { headers: { 'Content-Type': 'image/jpeg' } }),
    );
    const res = await get('65535/54930726586_abd52c470f_h.jpg');
    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://live.staticflickr.com/65535/54930726586_abd52c470f_h.jpg',
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=31536000');
    expect(await res.text()).toBe('jpeg bytes');
  });

  it('refuses anything that is not a Flickr photo file', async () => {
    vi.stubGlobal('fetch', mockFetch);
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

  it("doesn't cache Flickr errors", async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 503 }));
    const busy = await get('65535/1_abc.jpg');
    expect(busy.status).toBe(502);
    expect(busy.headers.get('Cache-Control')).toBe('no-store');

    mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect((await get('65535/2_abc.jpg')).status).toBe(404);
  });
});
