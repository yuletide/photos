import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ReactNode } from 'react';
import Providers from '@/components/Providers';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import Navigation from '@/components/Navigation';

const Layout = ({ children }: { children: ReactNode }) => (
  <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
    <body className="min-h-screen">
      <Providers>
        <header className="sticky top-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="text-center">
            <h1 className="text-2xl font-light tracking-widest text-white uppercase">
              Photos
            </h1>
            <Navigation />
          </div>
        </header>

        <main className="p-4">{children}</main>

        <footer className="w-full p-8 mt-16 text-center">
          <p className="text-xs text-gray-600">
            © 2025 Yuletide. Powered by Flickr.
          </p>
        </footer>
      </Providers>
      <Analytics />
    </body>
  </html>
);

export default Layout;
