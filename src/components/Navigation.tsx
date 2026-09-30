import Link from 'next/link';
import { galleryConfig } from '@/config/galleries';

const linkClass =
  'text-xs text-gray-400 hover:text-white transition-colors tracking-wider uppercase';

const Navigation = () => (
  <nav className="mt-2 space-x-6">
    <Link href="/" className={linkClass}>
      All
    </Link>
    {galleryConfig.map((cat) => (
      <Link href={`/category/${cat.slug}`} key={cat.slug} className={linkClass}>
        {cat.name}
      </Link>
    ))}
  </nav>
);

export default Navigation;
