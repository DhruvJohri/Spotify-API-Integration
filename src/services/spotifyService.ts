import axios from 'axios';

// API URLs
const BASE_URL = import.meta.env.VITE_SPOTIFY_API_URL || 'https://api.spotify.com/v1';

// We'll use this function to make authenticated requests to Spotify API
const apiClient = async () => {
  const token = localStorage.getItem('spotify_access_token');
  
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

export const fetchTopTracks = async () => {
  try {
    const api = await apiClient();
    const response = await api.get('/me/top/tracks', {
      params: {
        limit: 10,
        time_range: 'medium_term', // Options: short_term, medium_term, long_term
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    throw error;
  }
};

export const fetchCurrentlyPlaying = async () => {
  try {
    const api = await apiClient();
    const response = await api.get('/me/player/currently-playing');
    return response.data;
  } catch (error) {
    // If 204 No Content is returned, it means nothing is playing
    if (axios.isAxiosError(error) && error.response?.status === 204) {
      return { is_playing: false };
    }
    console.error('Error fetching currently playing:', error);
    throw error;
  }
};

export const fetchFollowedArtists = async () => {
  try {
    const api = await apiClient();
    const response = await api.get('/me/following', {
      params: {
        type: 'artist',
        limit: 20,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching followed artists:', error);
    throw error;
  }
};

// Control playback (play/pause)
export const controlPlayback = async (action: 'play' | 'pause', uri?: string) => {
  try {
    const api = await apiClient();
    
    if (action === 'pause') {
      await api.put('/me/player/pause');
      return { success: true };
    } else if (action === 'play' && uri) {
      await api.put('/me/player/play', {
        uris: [uri]
      });
      return { success: true };
    } else if (action === 'play') {
      await api.put('/me/player/play');
      return { success: true };
    }
    
    throw new Error('Invalid action or missing URI');
  } catch (error) {
    console.error('Error controlling playback:', error);
    throw error;
  }
};