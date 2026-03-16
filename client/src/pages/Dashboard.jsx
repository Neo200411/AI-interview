import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axiosInstance.get('/api/session/history');
        const sortedSessions = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSessions(sortedSessions);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch sessions.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getScoreBadgeClass = (score) => {
    if (score < 5) return 'badge-red';
    if (score < 8) return 'badge-yellow';
    return 'badge-green';
  };

  const formatDate = (dateString, short = false) => {
    const options = short 
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Prepare chart data (reverse to chronological order)
  const chartData = sessions
    .filter(s => s.overallScore !== undefined)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(s => ({
      date: formatDate(s.createdAt, true),
      score: parseFloat((s.overallScore || 0).toFixed(1)),
      role: s.role
    }));

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-1)' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-3)' }}>{payload[0].payload.role}</p>
          <p style={{ margin: '0.4rem 0 0', fontWeight: 800, fontSize: '1rem', color: 'var(--accent)' }}>Score: {payload[0].value}/10</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome back, <span>{user?.name || user?.email?.split('@')[0]}</span></h1>
        <button className="btn-primary" onClick={() => navigate('/session/new')}>
          + New Interview
        </button>
      </div>

      <div className="dashboard-content">
        
        {/* Progress Chart */}
        {!loading && !error && chartData.length >= 2 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2>Progress Over Time</h2>
            <div style={{ background: 'var(--surface)', padding: '1.5rem 1.5rem 0.5rem 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-3)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis domain={[0, 10]} stroke="var(--text-3)" fontSize={11} tickLine={false} axisLine={false} tickCount={6} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-light)', strokeWidth: 1 }} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="var(--accent)" 
                    strokeWidth={3}
                    dot={{ fill: 'var(--surface)', stroke: 'var(--accent)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--surface)' }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <h2>Your Past Interviews</h2>
        
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading sessions...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <p>No interviews yet. Start your first one!</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map((session) => (
              <div key={session._id} className="session-card fade-in">
                <div className="session-card-header">
                  <h3>{session.role}</h3>
                  <span className={`score-badge ${getScoreBadgeClass(session.overallScore)}`}>
                    Score: {session.overallScore ? session.overallScore.toFixed(1) : 0}/10
                  </span>
                </div>
                <p className="job-desc-preview" style={{ marginBottom: '0.4rem' }}>
                  {session.difficulty && <span style={{ display: 'inline-block', background: 'var(--surface-3)', border: '1px solid var(--border-light)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-2)', marginRight: '0.5rem' }}>{session.difficulty}</span>}
                  {session.jobDescription.substring(0, 60)}...
                </p>
                <div className="session-meta">
                  <span>{session.answers?.length || 0} questions answered</span>
                  <span>{formatDate(session.createdAt)}</span>
                </div>
                <button 
                  className="btn-outline w-full mt-4"
                  onClick={() => navigate(`/session/${session._id}/results`)}
                >
                  View Results
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
