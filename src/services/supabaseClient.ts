import axios from 'axios';

// Set up the base URL for your Supabase Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a client to interact with the Spotify API Edge Function
const edgeFunctionClient = axios.create({
  baseURL: `${SUPABASE_URL}/functions/v1/spotify-api`,
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const exchangeCodeForToken = async (code: string) => {
  try {
    const response = await edgeFunctionClient.get('/callback', {
      params: { code },
    });
    return response.data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

export const refreshToken = async (refreshToken: string) => {
  try {
    const response = await edgeFunctionClient.get('/refresh', {
      params: { refresh_token: refreshToken },
    });
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export default edgeFunctionClient;