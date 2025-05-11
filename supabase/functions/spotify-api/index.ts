import { createClient } from 'npm:@supabase/supabase-js@2.9.1';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.177.0/encoding/base64.ts';

// Environment variables (set in Supabase Dashboard)
const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET') || '';
const REDIRECT_URI = Deno.env.get('SPOTIFY_REDIRECT_URI') || '';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Get the auth token from the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid Authorization header' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    );
  }

  // Get the path and query parameters
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    let responseData;

    if (path === 'callback') {
      // Handle OAuth callback
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Exchange code for tokens
      responseData = await exchangeCodeForToken(code);
    } else if (path === 'refresh') {
      // Handle token refresh
      const refreshToken = url.searchParams.get('refresh_token');
      if (!refreshToken) {
        return new Response(
          JSON.stringify({ error: 'Missing refresh token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Refresh the access token
      responseData = await refreshAccessToken(refreshToken);
    } else if (path === 'top-tracks') {
      // Get the access token from the Authorization header
      const accessToken = authHeader.split(' ')[1];
      
      // Fetch top tracks from Spotify API
      responseData = await fetchFromSpotify('/me/top/tracks?limit=10&time_range=medium_term', accessToken);
    } else if (path === 'currently-playing') {
      // Get the access token from the Authorization header
      const accessToken = authHeader.split(' ')[1];
      
      // Fetch currently playing from Spotify API
      responseData = await fetchFromSpotify('/me/player/currently-playing', accessToken);
    } else if (path === 'followed-artists') {
      // Get the access token from the Authorization header
      const accessToken = authHeader.split(' ')[1];
      
      // Fetch followed artists from Spotify API
      responseData = await fetchFromSpotify('/me/following?type=artist&limit=20', accessToken);
    } else if (path === 'play') {
      // Get the access token from the Authorization header
      const accessToken = authHeader.split(' ')[1];
      
      // Get URI from request body
      const { uri } = await req.json();
      
      // Play the track
      responseData = await controlPlayback('play', accessToken, uri);
    } else if (path === 'pause') {
      // Get the access token from the Authorization header
      const accessToken = authHeader.split(' ')[1];
      
      // Pause playback
      responseData = await controlPlayback('pause', accessToken);
    } else {
      // Unknown endpoint
      return new Response(
        JSON.stringify({ error: 'Unknown endpoint' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Return the response
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    
    // Handle Spotify API errors
    if (error.response) {
      return new Response(
        JSON.stringify({ error: error.response.data?.error?.message || 'Spotify API error', status: error.response.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error.response.status }
      );
    }
    
    // Handle generic errors
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to exchange authorization code for tokens
async function exchangeCodeForToken(code: string) {
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';
  const authorization = base64Encode(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authorization}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || 'Failed to exchange code for token');
  }
  
  return await response.json();
}

// Helper function to refresh access token
async function refreshAccessToken(refreshToken: string) {
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';
  const authorization = base64Encode(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authorization}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || 'Failed to refresh token');
  }
  
  return await response.json();
}

// Helper function to fetch data from Spotify API
async function fetchFromSpotify(endpoint: string, accessToken: string) {
  const apiUrl = 'https://api.spotify.com/v1';
  
  const response = await fetch(`${apiUrl}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  // Handle 204 No Content (commonly returned when nothing is playing)
  if (response.status === 204) {
    return { is_playing: false };
  }
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - token may have expired');
    }
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `Spotify API error: ${response.status}`);
  }
  
  return await response.json();
}

// Helper function to control playback
async function controlPlayback(action: 'play' | 'pause', accessToken: string, uri?: string) {
  const apiUrl = 'https://api.spotify.com/v1';
  const endpoint = `/me/player/${action}`;
  
  const options: RequestInit = {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  // If playing a specific track, include the URI in the request body
  if (action === 'play' && uri) {
    options.body = JSON.stringify({
      uris: [uri],
    });
  }
  
  const response = await fetch(`${apiUrl}${endpoint}`, options);
  
  // 204 No Content is the expected response for successful playback control
  if (response.status === 204) {
    return { success: true };
  }
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `Failed to ${action} playback`);
  }
  
  return { success: true };
}