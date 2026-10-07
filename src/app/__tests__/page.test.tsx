import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getPhotosets } from '@/lib/flickr';
import { getPublishedPhotos } from '@/lib/published';
import Home from '../page';

vi.mock('next/server', () => ({ connection: vi.fn() }));
vi.mock('@/config/galleries', () => ({
  filterPhotosetsByConfig: <T,>(sets: T) => sets,
}));
vi.mock('@/lib/flickr', () => ({ getPhotosets: vi.fn() }));
vi.mock('@/lib/published', () => ({ getPublishedPhotos: vi.fn() }));

describe('Home', () => {
  it('still shows the albums when the featured photos fail to load', async () => {
    vi.mocked(getPhotosets).mockResolvedValue([
      {
        id: 'a',
        primary: '',
        count_photos: 1,
        title: { _content: 'Album a' },
        description: { _content: '' },
      },
    ]);
    vi.mocked(getPublishedPhotos).mockRejectedValue(
      new Error('Flickr flickr.photosets.getPhotos failed with HTTP 500'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(await Home());

    expect(screen.getByText('Album a')).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
  });
});
