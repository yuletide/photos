import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoGrid } from '../PhotoGrid';

const photo = (id: string, extra = {}) => ({
  id,
  secret: 's',
  server: '1',
  title: `Photo ${id}`,
  tags: 'flowers',
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

const mockFetch = vi.fn();

describe('PhotoGrid', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(Response.json(null));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it('eager-loads exactly the first six rendered images', () => {
    const many = [
      photo('p0'),
      photo('p1'),
      { ...photo('no-thumb'), url_m: undefined }, // not rendered
      ...['p2', 'p3', 'p4', 'p5', 'p6', 'p7'].map((id) => photo(id)),
    ];
    render(<PhotoGrid photos={many} />);
    const loading = screen
      .getAllByRole('img')
      .map((img) => [img.getAttribute('alt'), img.getAttribute('loading')]);
    expect(loading).toEqual([
      ['Photo p0', 'eager'],
      ['Photo p1', 'eager'],
      ['Photo p2', 'eager'],
      ['Photo p3', 'eager'],
      ['Photo p4', 'eager'],
      ['Photo p5', 'eager'],
      ['Photo p6', 'lazy'],
      ['Photo p7', 'lazy'],
    ]);
  });

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

  it('toggles the info panel with the (i) button and the i key', () => {
    render(<PhotoGrid photos={photos} />);
    fireEvent.click(screen.getAllByRole('link')[0]);
    expect(screen.queryByText('Photo a')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Show info (i)' }));
    expect(screen.getByText('Photo a')).toBeTruthy();
    expect(localStorage.getItem('photo-info')).toBe('1');

    fireEvent.keyDown(document, { key: 'i' });
    expect(screen.queryByText('Photo a')).toBeNull();
    expect(localStorage.getItem('photo-info')).toBe('0');
  });

  it('remembers the info panel preference', () => {
    localStorage.setItem('photo-info', '1');
    render(<PhotoGrid photos={photos} />);
    fireEvent.click(screen.getAllByRole('link')[0]);
    expect(screen.getByText('Photo a')).toBeTruthy();
  });

  it('fetches EXIF only once the info panel is shown', async () => {
    mockFetch.mockResolvedValue(
      Response.json({ camera: 'OM-1', exposureTime: '1/125 s' }),
    );
    render(<PhotoGrid photos={[photo('exif1')]} />);
    fireEvent.click(screen.getAllByRole('link')[0]);
    expect(mockFetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Show info (i)' }));
    expect(await screen.findByText('1/125 s')).toBeTruthy();
    expect(screen.getByText('OM-1')).toBeTruthy();
    expect(mockFetch).toHaveBeenCalledWith('/api/photos/exif1/exif');
  });

  it('still shows title and tags when EXIF is unavailable', async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 502 }));
    localStorage.setItem('photo-info', '1');
    render(<PhotoGrid photos={[photo('exif2')]} />);
    fireEvent.click(screen.getAllByRole('link')[0]);
    expect(screen.getByText('Photo exif2')).toBeTruthy();
    expect(screen.getByText('flowers')).toBeTruthy();
    await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(screen.queryByText('Shutter')).toBeNull();
  });
});
