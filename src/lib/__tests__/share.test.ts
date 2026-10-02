import { describe, expect, it } from 'vitest';
import { previewImage, shareMetadata } from '../share';

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
