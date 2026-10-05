import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FeaturedPhoto,
  SLIDE_MS,
  type FeaturedPhotoData,
} from '../FeaturedPhoto';

const featured = (id: string, extra = {}): FeaturedPhotoData => ({
  id,
  href: '/sets/1',
  title: `Photo ${id}`,
  caption: '',
  date: '',
  src: `https://example.com/${id}_m.jpg`,
  srcSet: `https://example.com/${id}_m.jpg 500w`,
  width: 500,
  height: 333,
  ...extra,
});

const photos = [featured('a'), featured('b'), featured('c')];
const shownTitle = () => screen.getByRole('img').getAttribute('alt');

describe('FeaturedPhoto', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts on the first photo and links it to the lightbox', () => {
    render(<FeaturedPhoto photos={photos} />);
    expect(shownTitle()).toBe('Photo a');
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/sets/1?photo=a',
    );
  });

  it('steps with the arrow buttons and wraps around', () => {
    render(<FeaturedPhoto photos={photos} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(shownTitle()).toBe('Photo c');
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(shownTitle()).toBe('Photo b');
  });

  it('steps with the ← and → keys', () => {
    render(<FeaturedPhoto photos={photos} />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(shownTitle()).toBe('Photo b');
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(shownTitle()).toBe('Photo c');
    fireEvent.keyDown(document, { key: 'ArrowRight', metaKey: true });
    expect(shownTitle()).toBe('Photo c'); // browser shortcuts left alone
  });

  it('names untitled photos by their caption, never leaving alt empty', () => {
    render(
      <FeaturedPhoto
        photos={[
          featured('x', { title: '', caption: 'Ulaanbaatar\nmore' }),
          featured('y', { title: '', caption: '' }),
        ]}
      />,
    );
    expect(shownTitle()).toBe('Ulaanbaatar');
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(shownTitle()).toBe('Photo');
  });

  it('shows when the photo was taken, if known', () => {
    render(
      <FeaturedPhoto
        photos={[featured('a', { date: 'March 3, 1998' }), featured('b')]}
      />,
    );
    expect(screen.getByText('March 3, 1998')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.queryByText('March 3, 1998')).toBeNull();
  });

  it('hides the arrows when there is only one photo', () => {
    render(<FeaturedPhoto photos={[featured('a')]} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('preloads both neighbors even if the photo loaded before hydration', () => {
    const preloaded: string[] = [];
    vi.stubGlobal(
      'Image',
      class {
        sizes = '';
        src = '';
        set srcset(value: string) {
          preloaded.push(value);
        }
      },
    );
    // Already loaded by the time React attaches onLoad.
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(
      true,
    );
    render(<FeaturedPhoto photos={photos} />);
    expect(preloaded).toEqual([photos[1].srcSet, photos[2].srcSet]);
  });

  describe('slideshow', () => {
    const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
    const play = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Play slideshow' }));
    const pause = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));

    it('plays on arrival, advancing every SLIDE_MS until paused', () => {
      vi.useFakeTimers();
      render(<FeaturedPhoto photos={photos} />);
      wait(SLIDE_MS - 1);
      expect(shownTitle()).toBe('Photo a');
      wait(1);
      expect(shownTitle()).toBe('Photo b');
      wait(SLIDE_MS);
      expect(shownTitle()).toBe('Photo c');

      pause();
      wait(SLIDE_MS * 2);
      expect(shownTitle()).toBe('Photo c');

      play();
      wait(SLIDE_MS);
      expect(shownTitle()).toBe('Photo a');
    });

    it('starts paused for viewers who prefer reduced motion', () => {
      vi.useFakeTimers();
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
      }));
      render(<FeaturedPhoto photos={photos} />);
      wait(SLIDE_MS * 2);
      expect(shownTitle()).toBe('Photo a');
      expect(
        screen.getByRole('button', { name: 'Play slideshow' }),
      ).toBeTruthy();
    });

    it('gives a photo chosen with ←/→ its full time', () => {
      vi.useFakeTimers();
      render(<FeaturedPhoto photos={photos} />);
      wait(SLIDE_MS - 1000);
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(shownTitle()).toBe('Photo b');
      wait(SLIDE_MS - 1);
      expect(shownTitle()).toBe('Photo b');
      wait(1);
      expect(shownTitle()).toBe('Photo c');
    });

    it('waits while the tab is hidden', () => {
      vi.useFakeTimers();
      const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      render(<FeaturedPhoto photos={photos} />);
      wait(SLIDE_MS * 3);
      expect(shownTitle()).toBe('Photo a');

      hidden.mockReturnValue(false);
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      wait(SLIDE_MS);
      expect(shownTitle()).toBe('Photo b');
    });
  });
});
