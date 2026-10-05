import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Not found' };

// Replaces Next's default (white) 404 so it matches the rest of the site.
const NotFound = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
    <p className="text-sm uppercase tracking-widest text-gray-500">404</p>
    <p className="text-gray-300">There&rsquo;s nothing here.</p>
    <Link
      href="/"
      className="text-sm text-gray-400 underline-offset-4 transition-colors hover:text-white hover:underline"
    >
      Back to the photos
    </Link>
  </div>
);

export default NotFound;
