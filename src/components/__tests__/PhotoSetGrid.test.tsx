import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhotoSetGrid } from '../PhotoSetGrid';

const album = (id: string, cover = true) => ({
  id,
  primary: '',
  count_photos: 1,
  title: { _content: `Album ${id}` },
  description: { _content: '' },
  ...(cover && {
    primary_photo_extras: {
      url_m: `https://example.com/${id}.jpg`,
      width_m: 500,
      height_m: 333,
    },
  }),
});

describe('PhotoSetGrid', () => {
  it('eager-loads the first six covers, skipping albums without one', () => {
    const albums = [
      album('a0'),
      album('no-cover', false),
      ...['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((id) => album(id)),
    ];
    render(<PhotoSetGrid photosets={albums} />);
    const loading = screen
      .getAllByRole('img')
      .map((img) => [img.getAttribute('alt'), img.getAttribute('loading')]);
    expect(loading).toEqual([
      ['Album a0', 'eager'],
      ['Album a1', 'eager'],
      ['Album a2', 'eager'],
      ['Album a3', 'eager'],
      ['Album a4', 'eager'],
      ['Album a5', 'eager'],
      ['Album a6', 'lazy'],
    ]);
  });
});
