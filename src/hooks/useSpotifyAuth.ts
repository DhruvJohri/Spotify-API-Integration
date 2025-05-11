import { useState, useEffect } from 'react';
import { exchangeCodeForToken, refreshToken } from '../services/supabaseClient';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin + '/spotify';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-follow-read'
];

export const useSpotifyAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      const token = localStorage.getItem('spotify_access_token');
      const expiry = localStorage.getItem('spotify_token_expiry');
      
      if (token && expiry && Number(expiry) > Date.now()) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
          
          const tokens = await exchangeCodeForToken(code);
          localStorage.setItem('spotify_access_token', tokens.access_token);
          localStorage.setItem('spotify_refresh_token', tokens.refresh_token);
          localStorage.setItem('spotify_token_expiry', String(Date.now() + tokens.expires_in * 1000));
          
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error exchanging code for token:', error);
          localStorage.removeItem('spotify_access_token');
          localStorage.removeItem('spotify_refresh_token');
          localStorage.removeItem('spotify_token_expiry');
        }
      } else {
        const refreshTokenStr = localStorage.getItem('spotify_refresh_token');
        if (refreshTokenStr) {
          try {
            const tokens = await refreshToken(refreshTokenStr);
            localStorage.setItem('spotify_access_token', tokens.access_token);
            localStorage.setItem('spotify_token_expiry', String(Date.now() + tokens.expires_in * 1000));
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Error refreshing token:', error);
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_refresh_token');
            localStorage.removeItem('spotify_token_expiry');
          }
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  const login = () => {
    const state = generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);
    
    const authUrl = new URL(AUTH_ENDPOINT);
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    
    window.location.href = authUrl.toString();
  };
  
  const logout = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    setIsAuthenticated(false);
  };
  
  return { isAuthenticated, isLoading, login, logout };
};

const generateRandomString = (length: number) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return text;
};