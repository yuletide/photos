import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Flickr's CDN already serves pre-sized JPEGs (url_m, url_l, ...), so
    // skip Vercel Image Optimization and load them directly.
    unoptimized: true,
  },
};

export default nextConfig;
