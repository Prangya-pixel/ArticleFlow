import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

import AuthenticationModule from './modules/authentication/AuthenticationModule.jsx';
import ContentManagementModule from './modules/contentManagement/ContentManagementModule.jsx';

import './index.css';

function App() {
  const [user, setUser] = useState(null);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleLogout() {
    localStorage.removeItem('articleflow_token');
    setUser(null);
  }

  if (!user) {
    return (
      <AuthenticationModule
        onLogin={handleLogin}
      />
    );
  }

  // Admin → Content Management
  if (user.role === 'admin') {
    return (
      <ContentManagementModule
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>Welcome, {user.name}</h1>

      <p>
        You are signed in as <strong>{user.role}</strong>.
      </p>

      <button onClick={handleLogout}>
        Sign out
      </button>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);