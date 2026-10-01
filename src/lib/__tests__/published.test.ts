import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPhotoset, getPhotosByTags } from '@/lib/flickr';
import { isPublishedPhoto } from '../published';

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
