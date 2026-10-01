import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LatestPhoto } from '../LatestPhoto';

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

  it('leaves out file-name titles', () => {
    render(
      <LatestPhoto
        latest={{
          ...latest,
          photo: { ...latest.photo, title: 'P1030363.jpg' },
        }}
      />,
    );
    expect(screen.queryByText('P1030363.jpg')).toBeNull();
  });
});
