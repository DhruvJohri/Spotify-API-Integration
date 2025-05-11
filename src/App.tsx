import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SpotifyPage from './components/SpotifyPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/spotify" element={<SpotifyPage />} />
    </Routes>
  );
}

export default App;