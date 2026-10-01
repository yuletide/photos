import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { displayTitle, PhotoInfo, visibleTags } from '../PhotoInfo';

describe('PhotoInfo', () => {
  it('hides file-name titles', () => {
    expect(displayTitle('20250103-P1030363.jpg')).toBe('');
    expect(displayTitle('Crowdsurf at DNA')).toBe('Crowdsurf at DNA');
  });

  it('hides curation and machine tags', () => {
    expect(visibleTags('metal gallery uploaded:by=instagram sf')).toEqual([
      'metal',
      'sf',
    ]);
  });

  it('shows title, date, exposure, gear and tags', () => {
    render(
      <PhotoInfo
        photo={{
          id: 'p1',
          secret: '',
          server: '',
          title: 'Crowdsurf',
          datetaken: '2025-01-03 20:57:33',
          tags: 'metal gallery sf',
          exif: {
            camera: 'GX85',
            lens: '25mm F1.7',
            exposureTime: '1/250 s',
            aperture: 'f/1.7',
            iso: '3200',
          },
        }}
      />,
    );
    expect(screen.getByText('Crowdsurf')).toBeTruthy();
    expect(screen.getByText('January 3, 2025')).toBeTruthy();
    expect(screen.getByText('1/250 s')).toBeTruthy();
    expect(screen.getByText('f/1.7')).toBeTruthy();
    expect(screen.getByText('3200')).toBeTruthy();
    expect(screen.getByText('GX85')).toBeTruthy();
    expect(screen.getByText('25mm F1.7')).toBeTruthy();
    expect(screen.queryByText('Focal length')).toBeNull();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(
      ['metal', 'sf'],
    );
    expect(
      screen.getByRole('link', { name: /View on Flickr/ }).getAttribute('href'),
    ).toBe('https://www.flickr.com/photo.gne?id=p1');
  });

  it('renders without EXIF or a date', () => {
    render(
      <PhotoInfo
        photo={{ id: 'p1', secret: '', server: '', title: 'a.jpg', tags: '' }}
      />,
    );
    expect(screen.queryByRole('list')).toBeNull();
  });
});
