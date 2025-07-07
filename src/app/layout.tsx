import { Camera } from "lucide-react";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Camera className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Photo Gallery</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              All Photos
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Trips
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Concerts
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Best Of
            </a>
          </nav>
        </div>
      </div>
    </header>

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </main>

    <footer className="bg-white border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500 text-sm">
          <p>© 2025 Photo Gallery. Powered by Flickr.</p>
        </div>
      </div>
    </footer>
  </div>
);

export default Layout;