'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { galleryConfig } from '@/config/galleries';

const linkClass =
  'text-xs tracking-wider uppercase underline-offset-[6px] transition-colors';
const idle = 'text-gray-400 hover:text-white';
const current = 'text-white underline decoration-gray-500';

// Which nav item a path belongs to: "/" for All, a category slug, or the
// category that contains an album (so /sets/<id> highlights e.g. Travel).
const currentSection = (pathname: string) => {
  const [, kind, id] = pathname.split('/');
  if (kind === 'category') return id;
  if (kind === 'sets') {
    return galleryConfig.find((c) => c.photosetIds.includes(id))?.slug;
  }
  return pathname === '/' ? '/' : undefined;
};

const Navigation = () => {
  const section = currentSection(usePathname());
  const scroller = useRef<HTMLDivElement>(null);
  // Whether more links are hidden off the right edge (phones, many categories).
  const [moreRight, setMoreRight] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () =>
      setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    // Bring the current page's link into view without scrolling the page.
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) {
      el.scrollLeft =
        active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2;
    }
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [section]);

  const item = (href: string, key: string, label: string) => (
    <Link
      href={href}
      key={key}
      aria-current={section === key ? 'page' : undefined}
      className={`${linkClass} ${section === key ? current : idle} shrink-0 py-1`}
    >
      {label}
    </Link>
  );

  // One row that scrolls sideways when the links don't fit (phones); a fade on
  // the right edge hints there's more. Centered when everything fits.
  return (
    <nav className="mt-2">
      <div
        ref={scroller}
        className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          moreRight
            ? '[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]'
            : ''
        }`}
      >
        <div className="mx-auto flex w-max gap-6 px-2">
          {item('/', '/', 'All')}
          {galleryConfig.map((cat) =>
            item(`/category/${cat.slug}`, cat.slug, cat.name),
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
