import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  displayTitle,
  PhotoInfo,
  plainCaption,
  visibleTags,
} from '../PhotoInfo';

describe('PhotoInfo', () => {
  it('hides file-name titles', () => {
    expect(displayTitle('20250103-P1030363.jpg')).toBe('');
    expect(displayTitle('20230821-P8210388')).toBe('');
    expect(displayTitle('20260419-_4192597')).toBe('');
    expect(displayTitle('20070831_MG_4415')).toBe('');
    expect(displayTitle('Crowdsurf at DNA')).toBe('Crowdsurf at DNA');
    expect(displayTitle('Moonglow')).toBe('Moonglow');
    expect(displayTitle('Cuba 2017')).toBe('Cuba 2017');
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
          description: {
            _content:
              'Lake Hövsgöl, <a href="https://x">Mongolia</a> &amp; Siberia',
          },
        }}
        exif={{
          camera: 'GX85',
          lens: '25mm F1.7',
          exposureTime: '1/250 s',
          aperture: 'f/1.7',
          iso: '3200',
        }}
      />,
    );
    expect(screen.getByText('Crowdsurf')).toBeTruthy();
    expect(screen.getByText('January 3, 2025')).toBeTruthy();
    expect(screen.getByText('Lake Hövsgöl, Mongolia & Siberia')).toBeTruthy();
    expect(screen.getByText('1/250 s').closest('p')?.textContent).toBe(
      '1/250 s · f/1.7 · ISO 3200',
    );
    expect(screen.getByText('GX85 · 25mm F1.7')).toBeTruthy();
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

  it('turns Flickr description HTML into plain text', () => {
    expect(
      plainCaption(
        'Line one<br />Line &amp; two &quot;quoted&quot; &#x2014; <b>bold</b>',
      ),
    ).toBe('Line one\nLine & two "quoted" \u2014 bold');
    expect(plainCaption('<script>alert(1)</script>ok')).toBe('alert(1)ok');
    expect(plainCaption(undefined)).toBe('');
  });
});
