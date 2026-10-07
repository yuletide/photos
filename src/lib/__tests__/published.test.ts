import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPhotoset, getPhotosByTags } from '@/lib/flickr';
import { getPublishedPhotos, isPublishedPhoto } from '../published';

vi.mock('@/lib/flickr', () => ({
  getPhotoset: vi.fn(),
  getPhotosByTags: vi.fn(),
}));

const photos = (...ids: string[]) =>
  ids.map((id) => ({ id, secret: '', server: '', title: '' }));

describe('isPublishedPhoto', () => {
  beforeEach(() => {
    vi.mocked(getPhotoset).mockResolvedValue({
      title: 'Album',
      photos: photos('in-album'),
    });
    vi.mocked(getPhotosByTags).mockResolvedValue(photos('tagged'));
  });

  it('accepts photos in configured albums or tag categories', async () => {
    await expect(isPublishedPhoto('in-album')).resolves.toBe(true);
    await expect(isPublishedPhoto('tagged')).resolves.toBe(true);
  });

  it('rejects photos that are not on the site', async () => {
    await expect(isPublishedPhoto('elsewhere')).resolves.toBe(false);
  });
});

describe('getPublishedPhotos', () => {
  it('lists each photo once, albums first, with the page it is on', async () => {
    vi.mocked(getPhotoset).mockResolvedValue({
      title: 'Album',
      photos: photos('shared', 'in-album'),
    });
    vi.mocked(getPhotosByTags).mockResolvedValue(photos('shared', 'tagged'));

    const published = await getPublishedPhotos();
    const ids = published.map(({ photo }) => photo.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.indexOf('in-album')).toBeLessThan(ids.indexOf('tagged'));
    const href = (id: string) =>
      published.find(({ photo }) => photo.id === id)?.href;
    expect(href('shared')).toMatch(/^\/sets\//); // album wins
    expect(href('tagged')).toMatch(/^\/category\//);
  });
});
