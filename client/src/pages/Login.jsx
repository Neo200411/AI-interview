import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">

        <div className="auth-hero">
          <div className="ai-badge">✦ AI-Powered Interview Coach</div>
          <h2 className="auth-tagline">Ace your next<br /><span>tech interview</span></h2>
          <p className="auth-tagline-sub">Practice with real questions tailored to any job description, evaluated instantly by Llama AI.</p>
          <div className="auth-features">
            <div className="auth-feature-chip">🎯 Role-specific questions</div>
            <div className="auth-feature-chip">🤖 AI evaluation & scoring</div>
            <div className="auth-feature-chip">📊 Detailed feedback</div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to continue your practice</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          <div className="auth-footer">
            <Link to="/register">Don't have an account? <strong>Register</strong></Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
