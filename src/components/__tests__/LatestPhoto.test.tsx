import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { imageSizes, LatestPhoto } from '../LatestPhoto';

const latest = {
  href: '/category/flowers',
  photo: {
    id: '42',
    secret: '',
    server: '',
    title: 'Robotic Harvest',
    description: { _content: 'Lake Hövsgöl, Mongolia' },
    datetaken: '2007-09-27 16:17:09',
    url_m: 'https://example.com/42_m.jpg',
    width_m: 333,
    height_m: 500,
    url_k: 'https://example.com/42_k.jpg',
    width_k: 1365,
    height_k: 2048,
  },
};

describe('LatestPhoto', () => {
  it('links to the photo on its page and shows its caption', () => {
    render(<LatestPhoto latest={latest} />);
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/category/flowers?photo=42',
    );
    const img = screen.getByRole('img', { name: 'Robotic Harvest' });
    expect(img.getAttribute('srcset')).toBe(
      'https://example.com/42_m.jpg 333w, https://example.com/42_k.jpg 1365w',
    );
    expect(screen.getByText('Lake Hövsgöl, Mongolia')).toBeTruthy();
    expect(screen.getByText('September 27, 2007')).toBeTruthy();
  });

  it('leaves out file-name titles, naming the link by its caption', () => {
    render(
      <LatestPhoto
        latest={{
          ...latest,
          photo: { ...latest.photo, title: 'P1030363.jpg' },
        }}
      />,
    );
    expect(screen.queryByText('P1030363.jpg')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Lake Hövsgöl, Mongolia' }),
    ).toBeTruthy();
  });

  it('falls back to a generic link name', () => {
    render(
      <LatestPhoto
        latest={{
          ...latest,
          photo: { ...latest.photo, title: '', description: { _content: '' } },
        }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Latest photo' })).toBeTruthy();
  });

  it('sizes portraits by the height cap on wide screens', () => {
    // 333x500 portrait: height-bound once the viewport is wider than 0.5:1.
    expect(imageSizes(latest.photo)).toBe(
      '(max-aspect-ratio: 500/1000) calc(100vw - 2rem), calc(75vh * 0.666)',
    );
  });
});
