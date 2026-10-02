'use client';

import Link from 'next/link';
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
  const item = (href: string, key: string, label: string) => (
    <Link
      href={href}
      key={key}
      aria-current={section === key ? 'page' : undefined}
      className={`${linkClass} ${section === key ? current : idle}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="mt-2 space-x-6">
      {item('/', '/', 'All')}
      {galleryConfig.map((cat) =>
        item(`/category/${cat.slug}`, cat.slug, cat.name),
      )}
    </nav>
  );
};

export default Navigation;
