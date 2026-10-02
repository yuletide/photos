import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { galleryConfig } from '@/config/galleries';
import Navigation from '../Navigation';

const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

const currentLinks = () =>
  screen
    .getAllByRole('link')
    .filter((a) => a.getAttribute('aria-current') === 'page')
    .map((a) => a.textContent);

describe('Navigation', () => {
  beforeEach(() => {
    pathname.current = '/';
  });

  it('marks All as current on the home page', () => {
    render(<Navigation />);
    expect(currentLinks()).toEqual(['All']);
  });

  it('marks the category being viewed', () => {
    pathname.current = '/category/botanical';
    render(<Navigation />);
    expect(currentLinks()).toEqual(['Botanical']);
  });

  it("marks an album's category on the album page", () => {
    const [travel] = galleryConfig;
    pathname.current = `/sets/${travel.photosetIds[0]}`;
    render(<Navigation />);
    expect(currentLinks()).toEqual([travel.name]);
  });

  it('marks nothing on other pages', () => {
    pathname.current = '/nope';
    render(<Navigation />);
    expect(currentLinks()).toEqual([]);
  });

  describe('sideways scrolling', () => {
    const fadeClass = '[mask-image';
    const dims = { clientWidth: 300, scrollWidth: 300 };
    const scrolls = new WeakMap<object, number>();
    const originals: [string, PropertyDescriptor | undefined][] = [];

    const mock = (name: string, desc: PropertyDescriptor) => {
      originals.push([
        name,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, name),
      ]);
      Object.defineProperty(HTMLElement.prototype, name, {
        configurable: true,
        ...desc,
      });
    };

    beforeEach(() => {
      dims.clientWidth = 300;
      dims.scrollWidth = 300;
      mock('clientWidth', { get: () => dims.clientWidth });
      mock('scrollWidth', { get: () => dims.scrollWidth });
      mock('offsetLeft', { get: () => 500 });
      mock('offsetWidth', { get: () => 100 });
      mock('scrollLeft', {
        get(this: HTMLElement) {
          return scrolls.get(this) ?? 0;
        },
        set(this: HTMLElement, v: number) {
          scrolls.set(this, v);
        },
      });
    });

    afterEach(() => {
      for (const [name, d] of originals.splice(0).reverse()) {
        if (d) Object.defineProperty(HTMLElement.prototype, name, d);
        else
          delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
            name
          ];
      }
    });

    const scroller = (container: HTMLElement) =>
      container.querySelector('nav > div') as HTMLElement;

    it('centers the current link in view on load', () => {
      pathname.current = '/category/botanical';
      const { container } = render(<Navigation />);
      // offsetLeft 500 - (clientWidth 300 - offsetWidth 100) / 2
      expect(scroller(container).scrollLeft).toBe(400);
    });

    it('does not scroll when nothing is current', () => {
      pathname.current = '/nope';
      const { container } = render(<Navigation />);
      expect(scroller(container).scrollLeft).toBe(0);
    });

    it('shows no fade when all links fit', () => {
      const { container } = render(<Navigation />);
      expect(scroller(container).className).not.toContain(fadeClass);
    });

    it('shows the fade while more links are off-screen and updates on scroll and resize', () => {
      dims.scrollWidth = 800;
      const { container } = render(<Navigation />);
      const el = scroller(container);
      expect(el.className).toContain(fadeClass);

      // scrolled to the end: nothing left to reveal
      act(() => {
        el.scrollLeft = 500;
        fireEvent.scroll(el);
      });
      expect(el.className).not.toContain(fadeClass);

      // widening the viewport beyond content keeps it hidden; narrowing brings it back
      act(() => {
        el.scrollLeft = 0;
        dims.clientWidth = 900;
        fireEvent(window, new Event('resize'));
      });
      expect(el.className).not.toContain(fadeClass);
      act(() => {
        dims.clientWidth = 300;
        fireEvent(window, new Event('resize'));
      });
      expect(el.className).toContain(fadeClass);
    });
  });
});
