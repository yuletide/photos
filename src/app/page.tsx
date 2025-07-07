import { Grid, MapPin, Music, Star } from "lucide-react";

// Homepage Component
const Home = () => {
  // Mock data for demonstration
  const galleryTypes = [
    {
      id: 'trips',
      title: 'Travel Photos',
      description: 'Adventures from around the world',
      icon: MapPin,
      count: 127,
      color: 'bg-blue-900/30 text-blue-400'
    },
    {
      id: 'concerts',
      title: 'Concert Photography',
      description: 'Live music moments captured',
      icon: Music,
      count: 89,
      color: 'bg-purple-900/30 text-purple-400'
    },
    {
      id: 'best-of',
      title: 'Best Of Collection',
      description: 'Curated highlights from all galleries',
      icon: Star,
      count: 42,
      color: 'bg-yellow-900/30 text-yellow-400'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Welcome to My Photo Gallery
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          A collection of moments captured through my lens. From travel adventures to 
          concert experiences, explore the world through photography.
        </p>
      </div>

      {/* Gallery Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {galleryTypes.map((gallery) => {
          const IconComponent = gallery.icon;
          return (
            <div
              key={gallery.id}
              className="bg-gray-900/50 border border-white/10 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${gallery.color}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-gray-400">
                  {gallery.count} photos
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                {gallery.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {gallery.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Featured Photos Preview */}
      <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-100">Recently Added</h3>
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            View All →
          </button>
        </div>
        
        {/* Photo Grid Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <Grid className="h-8 w-8 text-gray-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900/50 border border-white/10 rounded-xl p-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Gallery Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-400">258</div>
              <div className="text-sm text-gray-400">Total Photos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">23</div>
              <div className="text-sm text-gray-400">Collections</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">12</div>
              <div className="text-sm text-gray-400">Countries Visited</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
