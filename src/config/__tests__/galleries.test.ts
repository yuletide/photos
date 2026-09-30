import { describe, expect, it } from 'vitest';
import {
  allPhotosetIds,
  filterPhotosetsByConfig,
  galleryConfig,
} from '../galleries';

const [travel] = galleryConfig;
const sets = [
  { id: 'not-configured' },
  ...allPhotosetIds().map((id) => ({ id })),
].reverse();

describe('filterPhotosetsByConfig', () => {
  it('returns only configured sets, in config order', () => {
    expect(filterPhotosetsByConfig(sets).map((s) => s.id)).toEqual(
      allPhotosetIds(),
    );
  });

  it('filters to a single category', () => {
    expect(filterPhotosetsByConfig(sets, travel.slug).map((s) => s.id)).toEqual(
      travel.photosetIds,
    );
  });

  it('returns nothing for an unknown category', () => {
    expect(filterPhotosetsByConfig(sets, 'nope')).toEqual([]);
  });

  it('skips configured IDs that Flickr did not return', () => {
    expect(filterPhotosetsByConfig([{ id: travel.photosetIds[0] }])).toEqual([
      { id: travel.photosetIds[0] },
    ]);
  });
});
