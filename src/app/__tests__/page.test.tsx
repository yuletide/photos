import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { galleryConfig } from '@/config/galleries';
import { getPhotosByTags, getPhotosets } from '@/lib/flickr';
import Home from '../page';

vi.mock('@/lib/flickr', () => ({
  getPhotosets: vi.fn(),
  getPhotosByTags: vi.fn(),
}));

const album = (id: string, title: string) => ({
  id,
  primary: '',
  count_photos: 3,
  title: { _content: title },
  description: { _content: '' },
  primary_photo_extras: {
    url_m: `https://example.com/${id}.jpg`,
    width_m: 500,
    height_m: 333,
  },
});

describe('Home (All)', () => {
  beforeEach(() => {
    vi.mocked(getPhotosets).mockResolvedValue(
      galleryConfig.flatMap((c) =>
        c.photosetIds.map((id) => album(id, `Album ${id}`)),
      ),
    );
  });

  it('shows a tile for each tag-based category with photos', async () => {
    vi.mocked(getPhotosByTags).mockResolvedValue([
      {
        id: 'p1',
        secret: '',
        server: '',
        title: 'Fern',
        url_m: 'https://example.com/p1.jpg',
      },
      {
        id: 'p2',
        secret: '',
        server: '',
        title: 'Lily',
        url_m: 'https://example.com/p2.jpg',
      },
    ]);
    render(await Home());
    const tagged = galleryConfig.find((c) => c.tags?.length)!;
    const link = screen.getByRole('link', { name: new RegExp(tagged.name) });
    expect(link.getAttribute('href')).toBe(`/category/${tagged.slug}`);
    expect(link.textContent).toContain('2 photos');
  });

  it('leaves out tag categories with no photos yet', async () => {
    vi.mocked(getPhotosByTags).mockResolvedValue([]);
    render(await Home());
    const tagged = galleryConfig.find((c) => c.tags?.length)!;
    expect(
      screen.queryByRole('link', { name: new RegExp(`^${tagged.name}`) }),
    ).toBeNull();
  });
});
