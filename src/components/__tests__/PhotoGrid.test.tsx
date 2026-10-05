import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoGrid, sizeLabel } from '../PhotoGrid';

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
    url_h: 'https://example.com/a_h.jpg',
    width_h: 1600,
    height_h: 1067,
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
    window.history.replaceState(null, '', '/sets/1');
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValue(Response.json(null));
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('puts the open photo in the URL', () => {
    render(<PhotoGrid photos={photos} />);
    fireEvent.click(screen.getAllByRole('link')[1]);
    expect(window.location.search).toBe('?photo=b');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('opens the photo from a shared link', () => {
    window.history.replaceState(null, '', '/sets/1?photo=b');
    render(<PhotoGrid photos={photos} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Photo b' })).toBeTruthy();
  });

  it('removes the photo from the URL when a shared link is closed', async () => {
    window.history.replaceState(null, '', '/sets/1?photo=a');
    render(<PhotoGrid photos={photos} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    // The lightbox calls close() after its fade-out animation.
    await vi.waitFor(() => expect(window.location.search).toBe(''));
  });

  it('ignores links to photos that are not on the page', () => {
    window.history.replaceState(null, '', '/sets/1?photo=gone');
    render(<PhotoGrid photos={photos} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('changing photos replaces history, and closing goes back to the gallery', async () => {
    render(<PhotoGrid photos={photos} />);
    const start = window.history.length;

    fireEvent.click(screen.getAllByRole('link')[0]);
    expect(window.location.search).toBe('?photo=a');
    expect(window.history.length).toBe(start + 1);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await vi.waitFor(() => expect(window.location.search).toBe('?photo=b'));
    expect(window.history.length).toBe(start + 1); // replaced, not pushed

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    // Closing a photo opened from the grid goes Back (popstate) to /sets/1.
    await vi.waitFor(() => expect(window.location.search).toBe(''));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('shows the small version right away when a large image fails', () => {
    render(<PhotoGrid photos={photos} />);
    fireEvent.click(screen.getAllByRole('link')[0]);
    const img = () =>
      document.querySelector<HTMLImageElement>('.yarl__slide_current img')!;
    expect(img().getAttribute('src')).toBe('https://example.com/a_k.jpg');

    fireEvent.error(img());
    expect(img().getAttribute('src')).toBe('https://example.com/a_m.jpg');
    expect(document.querySelector('.yarl__slide_error')).toBeNull();
  });

  it('retries upgrades with backoff and waits to preload neighbors until the current image loads', async () => {
    vi.useFakeTimers();
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      constructor() {
        requests.push(this);
      }
    }
    const requests: FakeImage[] = [];
    vi.stubGlobal('Image', FakeImage);
    const retryPhotos = [
      photo('a', {
        url_l: 'https://example.com/a_l.jpg',
        width_l: 1024,
        height_l: 683,
        url_h: 'https://example.com/a_h.jpg',
        width_h: 1600,
        height_h: 1067,
        url_k: 'https://example.com/a_k.jpg',
        width_k: 2048,
        height_k: 1365,
      }),
      photo('b'),
    ];

    render(<PhotoGrid photos={retryPhotos} />);
    fireEvent.click(screen.getAllByRole('link')[0]);

    const slideImages = () =>
      document.querySelectorAll<HTMLImageElement>('.yarl__slide img');
    const currentImage = () =>
      document.querySelector<HTMLImageElement>('.yarl__slide_current img')!;
    expect(slideImages()).toHaveLength(1);
    fireEvent.error(currentImage());
    expect(currentImage().getAttribute('src')).toBe(
      'https://example.com/a_m.jpg',
    );
    expect(document.querySelector('.yarl__slide_error')).toBeNull();

    for (const [index, delay] of [1000, 2000, 4000].entries()) {
      expect(requests[index].src).toBe('https://example.com/a_l.jpg');
      act(() => requests[index].onerror?.());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(delay - 1);
      });
      expect(requests).toHaveLength(index + 1);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(requests).toHaveLength(index + 2);
      expect(document.querySelector('.yarl__slide_error')).toBeNull();
      expect(slideImages()).toHaveLength(1);
    }

    await act(async () => {
      requests[3].onload?.();
      await Promise.resolve();
    });
    expect(currentImage().getAttribute('src')).toBe(
      'https://example.com/a_l.jpg',
    );
    expect(slideImages()).toHaveLength(1);

    await act(async () => {
      fireEvent.load(currentImage());
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(
      [...slideImages()].some(
        (img) => img.getAttribute('src') === 'https://example.com/b_m.jpg',
      ),
    ).toBe(true);
  });

  it('labels Flickr sizes for the debug badge', () => {
    expect(sizeLabel('https://x/1_abc_k.jpg')).toBe('2048px');
    expect(sizeLabel('https://x/1_abc_b.jpg')).toBe('1024px');
    expect(sizeLabel('https://x/1_abc.jpg')).toBe('500px');
    expect(sizeLabel('')).toBe('loading');
  });
});
