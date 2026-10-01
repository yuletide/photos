import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getExif,
  getPhotosByTags,
  getPhotoset,
  getPhotosets,
  REVALIDATE_SECONDS,
  withExif,
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

  it('formats the EXIF fields shown in the lightbox', async () => {
    const tag = (tag: string, raw: string) => ({
      tagspace: 'ExifIFD',
      tag,
      label: tag,
      raw: { _content: raw },
    });
    mockFetch.mockResolvedValue(
      jsonResponse({
        stat: 'ok',
        photo: {
          id: 'p1',
          camera: 'Panasonic DMC-GX85',
          exif: [
            tag('ExposureTime', '1/250'),
            tag('FNumber', '8.0'),
            tag('ISO', '1600'),
            tag('FocalLength', '25.0 mm'),
            tag('ExposureCompensation', '0'),
            tag('LensModel', 'LUMIX G 25/F1.7'),
          ],
        },
      }),
    );

    await expect(getExif('p1')).resolves.toEqual({
      camera: 'Panasonic DMC-GX85',
      lens: 'LUMIX G 25/F1.7',
      exposureTime: '1/250 s',
      aperture: 'f/8',
      iso: '1600',
      focalLength: '25 mm',
    });
  });

  it('returns no EXIF when Flickr hides it', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ stat: 'fail', code: 2, message: 'Permission denied' }),
    );
    await expect(getExif('p1')).resolves.toBeUndefined();
  });

  it('attaches EXIF to every photo, keeping order', async () => {
    mockFetch.mockImplementation(async (url: URL) => {
      const id = url.searchParams.get('photo_id');
      return jsonResponse({
        stat: 'ok',
        photo: { id, camera: `cam-${id}`, exif: [] },
      });
    });

    const ids = Array.from({ length: 20 }, (_, i) => `p${i}`);
    const photos = await withExif(
      ids.map((id) => ({ id, secret: '', server: '', title: '' })),
    );
    expect(photos.map((p) => [p.id, p.exif?.camera])).toEqual(
      ids.map((id) => [id, `cam-${id}`]),
    );
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
