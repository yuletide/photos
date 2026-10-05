import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeaturedPhoto, type FeaturedPhotoData } from '../FeaturedPhoto';

const featured = (id: string, extra = {}): FeaturedPhotoData => ({
  id,
  href: '/sets/1',
  title: `Photo ${id}`,
  caption: '',
  src: `https://example.com/${id}_m.jpg`,
  srcSet: `https://example.com/${id}_m.jpg 500w`,
  width: 500,
  height: 333,
  ...extra,
});

const photos = [featured('a'), featured('b'), featured('c')];
const shownTitle = () => screen.getByRole('img').getAttribute('alt');

describe('FeaturedPhoto', () => {
  it('starts on the given photo and links it to the lightbox', () => {
    render(<FeaturedPhoto photos={photos} start={1} />);
    expect(shownTitle()).toBe('Photo b');
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/sets/1?photo=b',
    );
  });

  it('steps with the arrow buttons and wraps around', () => {
    render(<FeaturedPhoto photos={photos} start={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(shownTitle()).toBe('Photo c');
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(shownTitle()).toBe('Photo b');
  });

  it('steps with the ← and → keys', () => {
    render(<FeaturedPhoto photos={photos} start={0} />);
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
        start={0}
      />,
    );
    expect(shownTitle()).toBe('Ulaanbaatar');
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(shownTitle()).toBe('Photo');
  });

  it('hides the arrows when there is only one photo', () => {
    render(<FeaturedPhoto photos={[featured('a')]} start={0} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
