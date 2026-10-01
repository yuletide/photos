import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhotoGrid } from '../PhotoGrid';

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

const photos = [
  photo('a', {
    url_k: 'https://example.com/a_k.jpg',
    width_k: 2048,
    height_k: 1365,
  }),
  photo('b'),
];

describe('PhotoGrid', () => {
  it('links each photo to its largest available size', () => {
    render(<PhotoGrid photos={photos} />);
    const [a, b] = screen.getAllByRole('link');
    expect(a.getAttribute('href')).toBe('https://example.com/a_k.jpg');
    expect(b.getAttribute('href')).toBe('https://example.com/b_m.jpg');
  });

  it('opens the lightbox on click instead of navigating', () => {
    render(<PhotoGrid photos={photos} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    const link = screen.getAllByRole('link')[1];
    expect(fireEvent.click(link)).toBe(false); // default prevented
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('leaves modified clicks to the browser', () => {
    render(<PhotoGrid photos={photos} />);
    expect(
      fireEvent.click(screen.getAllByRole('link')[0], { metaKey: true }),
    ).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
