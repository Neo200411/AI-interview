import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar no-print">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          InterviewPrep AI
        </Link>
        
        <div className="navbar-links">
          {token ? (
            <>
              <Link to="/profile" className="nav-link user-greeting" style={{ marginRight: '0.5rem' }}>
                Hi, {user?.name || user?.email?.split('@')[0]}
              </Link>
              <Link to="/session/new" className="btn-primary">
                New Interview
              </Link>
              <button onClick={handleLogout} className="btn-subtle">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn-primary nav-btn">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
