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
    expect(displayTitle('Crowdsurf at DNA')).toBe('Crowdsurf at DNA');
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
  it('turns Flickr description HTML into plain text', () => {
    expect(
      plainCaption(
        'Line one<br />Line &amp; two &quot;quoted&quot; <b>bold</b>',
      ),
    ).toBe('Line one\nLine & two "quoted" bold');
    expect(plainCaption('<script>alert(1)</script>ok')).toBe('alert(1)ok');
    expect(plainCaption(undefined)).toBe('');
  });

  it('decodes every HTML entity, including uppercase hex', () => {
    expect(
      plainCaption('Caf&eacute; &mdash; it&rsquo;s &#X2014; &#x2014;'),
    ).toBe('Café — it’s — —');
  });

  it('does not throw on out-of-range character references', () => {
    expect(() => plainCaption('a &#1114112; b &#x110000; c')).not.toThrow();
    expect(plainCaption('a &#1114112; b')).toBe('a \uFFFD b');
  });

  it('strips tags whose quoted attributes contain ">"', () => {
    expect(
      plainCaption('<a href="https://x.com/?q=a>b" title=\'c>d\'>Mongolia</a>'),
    ).toBe('Mongolia');
  });

  it('keeps encoded markup as visible text', () => {
    expect(plainCaption('&lt;b&gt;not bold&lt;/b&gt;')).toBe('<b>not bold</b>');
  });

  it('ignores placeholder descriptions written by cameras', () => {
    expect(plainCaption('OLYMPUS DIGITAL CAMERA')).toBe('');
    expect(plainCaption('SONY DSC')).toBe('');
    expect(plainCaption('Olympus at the lake')).toBe('Olympus at the lake');
  });
});
