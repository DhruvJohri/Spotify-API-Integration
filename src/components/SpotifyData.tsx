import React, { useEffect, useState } from 'react';
import { Play, Pause, Music, Users } from 'lucide-react';
import { fetchTopTracks, fetchCurrentlyPlaying, fetchFollowedArtists, controlPlayback } from '../services/spotifyService';

interface SpotifyDataProps {
  showRawJson: boolean;
}

const SpotifyData: React.FC<SpotifyDataProps> = ({ showRawJson }) => {
  const [topTracks, setTopTracks] = useState<any>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [followedArtists, setFollowedArtists] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [tracksRes, playingRes, artistsRes] = await Promise.all([
        fetchTopTracks(),
        fetchCurrentlyPlaying(),
        fetchFollowedArtists()
      ]);
      
      setTopTracks(tracksRes);
      setCurrentlyPlaying(playingRes);
      setFollowedArtists(artistsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Spotify data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh currently playing every 30 seconds
    const interval = setInterval(async () => {
      try {
        const playingRes = await fetchCurrentlyPlaying();
        setCurrentlyPlaying(playingRes);
      } catch (err) {
        console.error('Failed to update currently playing:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = async (uri?: string) => {
    try {
      if (uri) {
        await controlPlayback('play', uri);
      } else {
        await controlPlayback('pause');
      }
      // Refresh currently playing status after a short delay
      setTimeout(async () => {
        const playingRes = await fetchCurrentlyPlaying();
        setCurrentlyPlaying(playingRes);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to control playback');
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading Spotify data...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg">
        <h3 className="text-red-400 font-medium mb-2">Error</h3>
        <p>{error}</p>
        <button 
          onClick={fetchData} 
          className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Combine all data for JSON view
  const allData = {
    topTracks: topTracks?.items || [],
    currentlyPlaying: currentlyPlaying?.item ? currentlyPlaying : { is_playing: false },
    followedArtists: followedArtists?.artists?.items || []
  };

  if (showRawJson) {
    return (
      <pre className="bg-gray-950 p-6 rounded-lg overflow-auto max-h-[80vh] text-sm">
        {JSON.stringify(allData, null, 2)}
      </pre>
    );
  }

  return (
    <div className="space-y-8">
      {/* Currently Playing */}
      <section className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Music className="mr-2" /> 
          Currently Playing
        </h2>
        
        {currentlyPlaying?.item ? (
          <div className="flex items-center gap-4">
            {currentlyPlaying.item.album?.images?.[0]?.url && (
              <img 
                src={currentlyPlaying.item.album.images[0].url} 
                alt={`Album art for ${currentlyPlaying.item.album.name}`}
                className="w-16 h-16 rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium">{currentlyPlaying.item.name}</h3>
              <p className="text-gray-400">{currentlyPlaying.item.artists.map((a: any) => a.name).join(', ')}</p>
            </div>
            <button
              onClick={() => handlePlayPause()}
              className="p-3 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
              title="Stop playing"
            >
              <Pause size={18} />
            </button>
          </div>
        ) : (
          <p className="text-gray-400">Nothing playing right now</p>
        )}
      </section>

      {/* Top Tracks */}
      <section className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Top 10 Tracks</h2>
        
        {topTracks?.items?.length > 0 ? (
          <ul className="space-y-3">
            {topTracks.items.slice(0, 10).map((track: any) => (
              <li key={track.id} className="flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded transition-colors">
                {track.album?.images?.[0]?.url && (
                  <img 
                    src={track.album.images[2].url} 
                    alt={`Album art for ${track.album.name}`}
                    className="w-10 h-10 rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{track.name}</h3>
                  <p className="text-gray-400 truncate">{track.artists.map((a: any) => a.name).join(', ')}</p>
                </div>
                <button
                  onClick={() => handlePlayPause(track.uri)}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                  title="Play track"
                >
                  <Play size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No top tracks found</p>
        )}
      </section>

      {/* Followed Artists */}
      <section className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Users className="mr-2" /> 
          Followed Artists
        </h2>
        
        {followedArtists?.artists?.items?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {followedArtists.artists.items.map((artist: any) => (
              <div key={artist.id} className="text-center">
                {artist.images?.[0]?.url && (
                  <img 
                    src={artist.images[0].url} 
                    alt={`${artist.name}`}
                    className="w-16 h-16 mx-auto rounded-full object-cover mb-2"
                  />
                )}
                <h3 className="font-medium text-sm truncate">{artist.name}</h3>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No followed artists found</p>
        )}
      </section>
    </div>
  );
};

export default SpotifyData;