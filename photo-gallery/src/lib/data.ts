import { MapPin, Music, Star } from 'lucide-react';
import type { GalleryType } from '../types';

export const galleryTypes: GalleryType[] = [
  {
    id: 'trips',
    title: 'Travel Photos',
    description: 'Adventures from around the world',
    icon: MapPin,
    count: 127,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'concerts',
    title: 'Concert Photography',
    description: 'Live music moments captured',
    icon: Music,
    count: 89,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'best-of',
    title: 'Best Of Collection',
    description: 'Curated highlights from all galleries',
    icon: Star,
    count: 42,
    color: 'bg-yellow-100 text-yellow-600',
  },
];
