import React from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Welcome to My Portfolio</h1>
        <Link 
          to="/spotify" 
          className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
        >
          <Music size={20} />
          <span>Check out my Spotify Integration</span>
        </Link>
      </div>
    </div>
  );
};

export default Home;