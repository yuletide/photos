import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Camera } from "lucide-react";
import { ReactNode } from "react";
import "./globals.css";

const Layout = ({ children }: { children: ReactNode }) => (
  <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
    <body className="min-h-screen">
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-200/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Camera className="h-8 w-8 text-white" />
              <h1 className="text-xl font-bold text-white">Photo Gallery</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a
                href="#"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                All Photos
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Trips
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Concerts
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Best Of
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-transparent mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2025 Photo Gallery. Powered by Flickr.</p>
          </div>
        </div>
      </footer>
    </body>
  </html>
);

export default Layout;
