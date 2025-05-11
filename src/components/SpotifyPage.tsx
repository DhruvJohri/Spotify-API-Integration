import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, Loader } from 'lucide-react';
import { useSpotifyAuth } from '../hooks/useSpotifyAuth';
import SpotifyData from './SpotifyData';

const SpotifyPage: React.FC = () => {
  const { isAuthenticated, login, isLoading } = useSpotifyAuth();
  const [showRawJson, setShowRawJson] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Spotify Integration</h1>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <HomeIcon size={20} />
            <span>Home</span>
          </Link>
        </div>
        <p className="text-gray-400 mt-2">
          View my Spotify data including top tracks, currently playing, and followed artists
        </p>
      </header>

      <main className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin mr-2" />
            <span>Loading...</span>
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-gray-800 p-8 rounded-lg shadow-md text-center">
            <p className="mb-6">Connect to Spotify to view your data</p>
            <button
              onClick={login}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full font-medium transition-colors"
            >
              Connect with Spotify
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              >
                {showRawJson ? 'Show UI View' : 'Show Raw JSON'}
              </button>
            </div>
            <SpotifyData showRawJson={showRawJson} />
          </>
        )}
      </main>
    </div>
  );
};

export default SpotifyPage;