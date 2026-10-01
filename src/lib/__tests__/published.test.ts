import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPhotoset, getPhotosByTags } from '@/lib/flickr';
import { allPhotosetIds } from '@/config/galleries';
import { getLatestPhoto, isPublishedPhoto } from '../published';

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

describe('getLatestPhoto', () => {
  const photo = (id: string, dateupload: string, url_m = 'm.jpg') => ({
    id,
    secret: '',
    server: '',
    title: id,
    dateupload,
    url_m,
  });

  it('picks the newest upload and the page it appears on', async () => {
    const [firstAlbum] = allPhotosetIds();
    vi.mocked(getPhotoset).mockImplementation(async (id) => ({
      title: 'Album',
      photos: id === firstAlbum ? [photo('old', '100')] : [],
    }));
    vi.mocked(getPhotosByTags).mockResolvedValue([
      photo('newest', '300'),
      photo('no-thumb', '400', ''),
    ]);

    await expect(getLatestPhoto()).resolves.toEqual({
      photo: photo('newest', '300'),
      href: '/category/flowers',
    });
  });

  it('keeps the first page a photo appears on', async () => {
    vi.mocked(getPhotoset).mockResolvedValue({
      title: 'Album',
      photos: [photo('both', '500')],
    });
    vi.mocked(getPhotosByTags).mockResolvedValue([photo('both', '500')]);
    expect((await getLatestPhoto())?.href).toBe(`/sets/${allPhotosetIds()[0]}`);
  });
});
