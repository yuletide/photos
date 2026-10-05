import { describe, expect, it } from 'vitest';
import {
  photoShareMetadata,
  previewImage,
  shareMetadata,
  sharedPhoto,
} from '../share';

describe('previewImage', () => {
  it('prefers the largest preview-friendly size', () => {
    expect(
      previewImage({
        url_m: 'm.jpg',
        width_m: 500,
        height_m: 333,
        url_l: 'l.jpg',
        width_l: 1024,
        height_l: 683,
      }),
    ).toEqual({ url: 'l.jpg', width: 1024, height: 683 });
  });

  it('returns nothing without an image', () => {
    expect(previewImage(undefined)).toBeUndefined();
  });
});

describe('shareMetadata', () => {
  it('builds Open Graph and Twitter tags with a large image', () => {
    const meta = shareMetadata({
      title: 'Botanical',
      description: 'Botanical photographs by Alex Yule.',
      path: '/category/botanical',
      image: { url_h: 'h.jpg', width_h: 1600, height_h: 1067 },
    });
    expect(meta.openGraph).toMatchObject({
      siteName: 'Alex Yule Photos',
      title: 'Botanical',
      url: '/category/botanical',
      images: [{ url: 'h.jpg', width: 1600, height: 1067 }],
    });
    expect(meta.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['h.jpg'],
    });
  });

  it('falls back to a small card without an image', () => {
    const meta = shareMetadata({ description: 'x', path: '/' });
    expect(meta.twitter).toMatchObject({ card: 'summary' });
    expect(meta.openGraph).toMatchObject({ title: 'Alex Yule Photos' });
  });
});

describe('photo links', () => {
  const photo = (id: string, extra = {}) => ({
    id,
    secret: 's',
    server: '1',
    title: `Photo ${id}`,
    url_m: `https://example.com/${id}_m.jpg`,
    width_m: 500,
    height_m: 333,
    ...extra,
  });
  const photos = [photo('a'), photo('b', { url_m: undefined })];

  it('finds the linked photo only if it is on the page and has an image', () => {
    expect(sharedPhoto(photos, 'a')?.id).toBe('a');
    expect(sharedPhoto(photos, 'b')).toBeUndefined();
    expect(sharedPhoto(photos, 'gone')).toBeUndefined();
    expect(sharedPhoto(photos, ['a', 'a'])).toBeUndefined();
    expect(sharedPhoto(photos, undefined)).toBeUndefined();
  });

  it("previews the photo with its title and caption's first line", () => {
    const meta = photoShareMetadata({
      photo: photo('a', {
        title: 'Deference',
        description: { _content: 'Traditional Mongolian dance<br>Ulaanbaatar' },
      }),
      pageTitle: 'Travel',
      path: '/category/travel',
    });
    expect(meta.openGraph).toMatchObject({
      title: 'Deference',
      description: 'Traditional Mongolian dance',
      url: '/category/travel?photo=a',
      images: [{ url: 'https://example.com/a_m.jpg' }],
    });
  });

  it('falls back to the page for untitled, uncaptioned photos', () => {
    const meta = photoShareMetadata({
      photo: photo('a', { title: '20230715-P7150249' }),
      pageTitle: 'Botanical',
      path: '/category/botanical',
    });
    expect(meta.openGraph).toMatchObject({
      title: 'Botanical',
      description: 'From Botanical, by Alex Yule.',
    });
  });
});
