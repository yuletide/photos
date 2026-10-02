import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AutoHideHeader } from '../AutoHideHeader';

const scrollTo = async (y: number) => {
  await act(async () => {
    window.scrollY = y;
    window.dispatchEvent(new Event('scroll'));
    await new Promise((r) => requestAnimationFrame(r));
  });
};

describe('AutoHideHeader', () => {
  it('hides when scrolling down and returns when scrolling up', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(80);
    render(
      <AutoHideHeader>
        <button type="button">Menu</button>
      </AutoHideHeader>,
    );
    const header = screen.getByRole('banner');

    await scrollTo(400);
    expect(header.className).toContain('-translate-y-full');

    await scrollTo(300);
    expect(header.className).toContain('translate-y-0');

    await scrollTo(600);
    expect(header.className).toContain('-translate-y-full');
    fireEvent.focus(screen.getByRole('button'));
    expect(header.className).toContain('translate-y-0');
  });

  it('stays visible near the top of the page', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(80);
    window.scrollY = 0;
    render(<AutoHideHeader>x</AutoHideHeader>);
    await scrollTo(40);
    expect(screen.getByRole('banner').className).toContain('translate-y-0');
  });
});
