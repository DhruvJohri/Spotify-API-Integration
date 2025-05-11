# Spotify API Integration

This project integrates with the Spotify API to show your top 10 tracks, currently playing song, and followed artists. It provides playback controls to stop the currently playing song or start playing any of your top tracks.

🚀 Live Project : https://heroic-youtiao-ef3d55.netlify.app/

## Setup Instructions

1. Create a Spotify Developer Account:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Create a new application
   - Set the Redirect URI to match your deployed site URL + `/spotify` (e.g., `https://yoursite.com/spotify`)
   - Note your Client ID and Client Secret

2. Set up Supabase Edge Functions:
   - Deploy the Edge Function in the `supabase/functions/spotify-api` directory
   - Set the following environment variables in your Supabase Dashboard:
     - `SPOTIFY_CLIENT_ID`: Your Spotify Client ID
     - `SPOTIFY_CLIENT_SECRET`: Your Spotify Client Secret
     - `SPOTIFY_REDIRECT_URI`: The same redirect URI you configured in Spotify

3. Configure Environment Variables:
   - Create a `.env` file based on `.env.example`
   - Add your Spotify Client ID and Supabase credentials

4. Build and Deploy:
   ```
   npm run build
   ```

## Features

- OAuth authentication with Spotify
- Display your top 10 tracks with playback control
- Show currently playing track with stop functionality
- List artists you follow
- Both UI and raw JSON view options

## Technologies Used

- React with TypeScript
- Tailwind CSS for styling
- Supabase Edge Functions for secure API handling
- Spotify Web API
