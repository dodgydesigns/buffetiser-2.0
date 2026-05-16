import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './LoginPage.css'; // Import the CSS file

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from AuthContext

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/v1/token/', {
        username,
        password,
      });

      // Save the token in localStorage
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Update the AuthContext with user data
      login({ username });

      // Redirect to the dashboard
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
      console.error('Error logging in', err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label className="label">Username:</label>
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password:</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button className="button" type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
