import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import { useState, useEffect } from 'react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('avatarUrl'));

  const setAuth = (token, username, avatarUrl) => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      if (avatarUrl) localStorage.setItem('avatarUrl', avatarUrl);
      setToken(token);
      setUsername(username);
      setAvatarUrl(avatarUrl);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('avatarUrl');
      setToken(null);
      setUsername(null);
      setAvatarUrl(null);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!token ? <Auth setAuth={setAuth} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={token ? <Chat token={token} username={username} avatarUrl={avatarUrl} setAvatarUrl={(url) => setAuth(token, username, url)} logout={() => setAuth(null, null)} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
