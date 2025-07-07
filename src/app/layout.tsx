import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ReactNode } from 'react';
import './globals.css';

const Layout = ({ children }: { children: ReactNode }) => (
  <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
    <body className="min-h-screen">
      <header className="sticky top-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-widest text-white uppercase">
            Photo Gallery
          </h1>
          <nav className="mt-2 space-x-6">
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-white transition-colors tracking-wider uppercase"
            >
              All
            </a>
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-white transition-colors tracking-wider uppercase"
            >
              Trips
            </a>
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-white transition-colors tracking-wider uppercase"
            >
              Concerts
            </a>
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-white transition-colors tracking-wider uppercase"
            >
              Best Of
            </a>
          </nav>
        </div>
      </header>

      <main className="p-4">{children}</main>

      <footer className="w-full p-8 mt-16 text-center">
        <p className="text-xs text-gray-600">
          © 2025 Photo Gallery. Powered by Flickr.
        </p>
      </footer>
    </body>
  </html>
);

export default Layout;
