import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getExif,
  getPhotosByTags,
  getPhotoset,
  getPhotosets,
  REVALIDATE_SECONDS,
} from '../flickr';

const mockFetch = vi.fn();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('flickr client', () => {
  beforeEach(() => {
    vi.stubEnv('FLICKR_API_KEY', 'test-api-key');
    vi.stubEnv('FLICKR_USER_ID', 'test-user-id');
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("serves Flickr images through the site's /flickr/ proxy", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        stat: 'ok',
        photosets: {
          photoset: [
            {
              id: '1',
              primary_photo_extras: {
                url_m: 'https://live.staticflickr.com/65535/9_abc.jpg',
              },
              description: { _content: 'see https://example.com' },
            },
          ],
        },
      }),
    );
    const [set] = await getPhotosets();
    expect(set.primary_photo_extras?.url_m).toBe('/flickr/65535/9_abc.jpg');
    expect(set.description._content).toBe('see https://example.com');
  });

  it('fetches photosets with credentials and ISR caching', async () => {
    const photoset = [{ id: '1', title: { _content: 'Test Set' } }];
    mockFetch.mockResolvedValue(
      jsonResponse({ stat: 'ok', photosets: { photoset } }),
    );

    await expect(getPhotosets()).resolves.toEqual(photoset);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url.searchParams.get('method')).toBe('flickr.photosets.getList');
    expect(url.searchParams.get('api_key')).toBe('test-api-key');
    expect(url.searchParams.get('user_id')).toBe('test-user-id');
    expect(init).toEqual({ next: { revalidate: REVALIDATE_SECONDS } });
  });

  it('returns the title and photos for a photoset', async () => {
    const photo = [{ id: 'p1', title: 'A photo' }];
    mockFetch.mockResolvedValue(
      jsonResponse({ stat: 'ok', photoset: { title: 'Trip', photo } }),
    );

    await expect(getPhotoset('123')).resolves.toEqual({
      title: 'Trip',
      photos: photo,
    });
    expect(mockFetch.mock.calls[0][0].searchParams.get('photoset_id')).toBe(
      '123',
    );
  });

  it('fetches every page of photosets', async () => {
    mockFetch.mockImplementation(async (url: URL) => {
      const page = Number(url.searchParams.get('page'));
      return jsonResponse({
        stat: 'ok',
        photosets: { page, pages: 3, photoset: [{ id: `set-${page}` }] },
      });
    });

    const sets = await getPhotosets();
    expect(sets.map((s) => s.id)).toEqual(['set-1', 'set-2', 'set-3']);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('fetches every page of photos in a photoset', async () => {
    mockFetch.mockImplementation(async (url: URL) => {
      const page = Number(url.searchParams.get('page'));
      return jsonResponse({
        stat: 'ok',
        photoset: {
          title: 'Trip',
          page,
          pages: 2,
          photo: [{ id: `p${page}` }],
        },
      });
    });

    const { title, photos } = await getPhotoset('123');
    expect(title).toBe('Trip');
    expect(photos.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('searches every page of photos matching all tags', async () => {
    mockFetch.mockImplementation(async (url: URL) => {
      const page = Number(url.searchParams.get('page'));
      return jsonResponse({
        stat: 'ok',
        photos: { page, pages: 2, photo: [{ id: `p${page}` }] },
      });
    });

    const photos = await getPhotosByTags(['flowers', 'gallery']);
    expect(photos.map((p) => p.id)).toEqual(['p1', 'p2']);

    const [url] = mockFetch.mock.calls[0];
    expect(url.searchParams.get('method')).toBe('flickr.photos.search');
    expect(url.searchParams.get('tags')).toBe('flowers,gallery');
    expect(url.searchParams.get('tag_mode')).toBe('all');
    expect(url.searchParams.get('user_id')).toBe('test-user-id');
  });

  // Mock one getExif response. Entries are [tag, raw, clean?], shaped like
  // real Flickr payloads.
  const mockExif = (camera: string, entries: [string, string, string?][]) =>
    mockFetch.mockResolvedValue(
      jsonResponse({
        stat: 'ok',
        photo: {
          id: 'p1',
          camera,
          exif: entries.map(([tag, raw, clean]) => ({
            tagspace: 'ExifIFD',
            tag,
            label: tag,
            raw: { _content: raw },
            ...(clean && { clean: { _content: clean } }),
          })),
        },
      }),
    );

  it('formats the EXIF fields shown in the lightbox', async () => {
    // As returned by Flickr for an OM-1 photo.
    mockExif('OM Digital Solutions OM-1', [
      ['ExposureTime', '1/125', '0.008 sec (1/125)'],
      ['FNumber', '8.0', 'f/8.0'],
      ['ISO', '2000'],
      ['FocalLength', '25.0 mm', '25 mm'],
      ['ExposureCompensation', '0', '0 EV'],
      ['LensModel', 'OLYMPUS M.25mm F1.8'],
    ]);

    await expect(getExif('p1')).resolves.toEqual({
      camera: 'OM Digital Solutions OM-1',
      lens: 'OLYMPUS M.25mm F1.8',
      exposureTime: '1/125 s',
      aperture: 'f/8',
      iso: '2000',
      focalLength: '25 mm',
    });
  });

  it('normalizes values that arrive already formatted', async () => {
    mockExif('Canon EOS 20D', [
      ['ExposureTime', '0.006 sec (1/160)'],
      ['FNumber', 'f/4.5'],
      ['ISO', 'ISO 400'],
      ['FocalLength', '17 mm'],
      ['ExposureCompensation', '-2/3 EV'],
      ['Lens', '17.0-50.0 mm'],
    ]);

    await expect(getExif('p1')).resolves.toEqual({
      camera: 'Canon EOS 20D',
      lens: '17-50 mm',
      exposureTime: '1/160 s',
      aperture: 'f/4.5',
      iso: '400',
      focalLength: '17 mm',
      exposureBias: '-2/3 EV',
    });
  });

  it.each([
    ['-0.7', '-2/3 EV'],
    ['-0.3', '-1/3 EV'],
    ['+0.3', '+1/3 EV'],
    ['+1/3', '+1/3 EV'],
    ['-1', '-1 EV'],
    ['-1.7', '-1 2/3 EV'],
    ['-3.7', '-3 2/3 EV'],
    ['+0', undefined],
  ])('shows exposure compensation %s as %s', async (raw, expected) => {
    mockExif('', [['ExposureCompensation', raw]]);
    expect((await getExif('p1'))?.exposureBias).toBe(expected);
  });

  it('shows long exposures in seconds', async () => {
    mockExif('', [['ExposureTime', '20']]);
    expect((await getExif('p1'))?.exposureTime).toBe('20 s');
  });

  it('returns no EXIF when Flickr hides it', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ stat: 'fail', code: 2, message: 'Permission denied' }),
    );
    await expect(getExif('p1')).resolves.toBeUndefined();
  });

  it("keeps EXIF out of Next's data cache", async () => {
    // Flickr reports errors such as rate limits with HTTP 200, which the data
    // cache would otherwise keep like a success.
    mockExif('', []);
    await getExif('p1');
    expect(mockFetch.mock.calls[0][1]).toEqual({ cache: 'no-store' });
  });

  it('throws on Flickr API-level errors', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ stat: 'fail', message: 'Invalid API Key' }),
    );
    await expect(getPhotosets()).rejects.toThrow('Invalid API Key');
  });

  it('throws on HTTP errors', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, 503));
    await expect(getPhotosets()).rejects.toThrow('HTTP 503');
  });

  it('throws when credentials are missing', async () => {
    vi.stubEnv('FLICKR_API_KEY', '');
    await expect(getPhotosets()).rejects.toThrow('FLICKR_API_KEY');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
