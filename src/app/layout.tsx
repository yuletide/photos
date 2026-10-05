import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import Navigation from '@/components/Navigation';
import './globals.css';

const SITE_NAME = 'Alex Yule Photos';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: 'Photographs by Alex Yule.',
};

const Layout = ({ children }: { children: ReactNode }) => (
  <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
    <body className="min-h-screen">
      <header className="sticky top-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-widest text-white uppercase">
            <Link href="/">{SITE_NAME}</Link>
          </h1>
          <Navigation />
        </div>
      </header>

      <main className="p-4">{children}</main>

      <footer className="w-full p-8 mt-16 text-center">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} Alex Yule. Powered by Flickr.
        </p>
      </footer>
      <Analytics />
    </body>
  </html>
);

export default Layout;
