import { Grid } from 'lucide-react';

// Homepage Component
const Home = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700/80 transition-colors cursor-pointer"
        >
          <Grid className="h-8 w-8 text-gray-500" />
        </div>
      ))}
    </div>
  );
};

export default Home;
