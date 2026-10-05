import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
});
