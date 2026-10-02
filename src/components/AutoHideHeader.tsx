'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

// How far (px) to scroll before the header reacts, so small jitters on
// trackpads and phones don't make it flicker.
const THRESHOLD = 8;

// The sticky header slides away while scrolling down through photos and comes
// back as soon as you scroll up (or reach the top).
export const AutoHideHeader = ({ children }: { children: ReactNode }) => {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (Math.abs(delta) < THRESHOLD) return;
        const height = header.current?.offsetHeight ?? 0;
        setHidden(delta > 0 && y > height);
        lastY.current = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header
      ref={header}
      // Keyboard users tabbing into the nav always get it back.
      onFocusCapture={() => setHidden(false)}
      className={`sticky top-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent transition-transform duration-300 motion-reduce:transition-none ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      {children}
    </header>
  );
};
