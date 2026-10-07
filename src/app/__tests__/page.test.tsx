import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { galleryConfig } from '@/config/galleries';
import { getPhotosByTags, getPhotosets } from '@/lib/flickr';
import Home from '../page';

vi.mock('@/lib/flickr', () => ({
  getPhotosets: vi.fn(),
  getPhotosByTags: vi.fn(),
}));

const album = (id: string) => ({
  id,
  primary: '',
  count_photos: 3,
  title: { _content: `Album ${id}` },
  description: { _content: '' },
  primary_photo_extras: {
    url_m: `https://example.com/${id}.jpg`,
    width_m: 500,
    height_m: 333,
  },
});

const tagged = (id: string) => ({
  id,
  secret: '',
  server: '',
  title: id,
  url_m: `https://example.com/${id}.jpg`,
  width_m: 500,
  height_m: 333,
});

const tileLinks = () =>
  screen.getAllByRole('link').map((link) => link.getAttribute('href'));

describe('Home (All)', () => {
  beforeEach(() => {
    vi.mocked(getPhotosets).mockResolvedValue(
      galleryConfig.flatMap((c) => c.photosetIds.map(album)),
    );
    vi.mocked(getPhotosByTags).mockResolvedValue([tagged('p1'), tagged('p2')]);
  });

  it('shows one tile per category, in nav order', async () => {
    render(await Home());
    expect(tileLinks()).toEqual(
      galleryConfig.map((c) => `/category/${c.slug}`),
    );
  });

  it('counts album photos for album categories and tagged photos for tag ones', async () => {
    render(await Home());
    for (const category of galleryConfig) {
      const link = screen.getByRole('link', {
        name: new RegExp(`^${category.name}`),
      });
      const expected =
        category.photosetIds.length * 3 + (category.tags?.length ? 2 : 0);
      expect(link.textContent).toContain(`${expected} photos`);
    }
  });

  it('uses the first album cover, else the newest tagged photo', async () => {
    render(await Home());
    const albums = galleryConfig.find((c) => c.photosetIds.length)!;
    const tags = galleryConfig.find(
      (c) => c.tags?.length && !c.photosetIds.length,
    )!;
    const cover = (name: string) =>
      screen
        .getByRole('link', { name: new RegExp(`^${name}`) })
        .querySelector('img')
        ?.getAttribute('src');
    // next/image may wrap the URL (/_next/image?url=...) outside the app.
    expect(decodeURIComponent(cover(albums.name)!)).toContain(
      `https://example.com/${albums.photosetIds[0]}.jpg`,
    );
    expect(decodeURIComponent(cover(tags.name)!)).toContain(
      'https://example.com/p1.jpg',
    );
  });

  it('leaves out categories with nothing in them yet', async () => {
    vi.mocked(getPhotosByTags).mockResolvedValue([]);
    render(await Home());
    const empty = galleryConfig.filter(
      (c) => c.tags?.length && !c.photosetIds.length,
    );
    for (const category of empty) {
      expect(tileLinks()).not.toContain(`/category/${category.slug}`);
    }
  });
});
