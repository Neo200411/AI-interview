import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    targetRole: '',
    targetCompany: '',
    bio: ''
  });
  const [stats, setStats] = useState({ sessionCount: 0, joinedDate: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/api/user/profile');
        const data = response.data;
        setProfile({
          name: data.name || '',
          targetRole: data.targetRole || '',
          targetCompany: data.targetCompany || '',
          bio: data.bio || ''
        });
        setStats({
          sessionCount: data.sessionCount || 0,
          joinedDate: new Date(data.createdAt).toLocaleDateString()
        });
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Failed to load profile data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.id]: e.target.value });
    setMessage({ type: '', text: '' }); // clear message on edit
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axiosInstance.put('/api/user/profile', profile);
      // Update global auth state with new name if it changed
      if (response.data.name !== user.name) {
        const token = localStorage.getItem('token');
        login(token, response.data);
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container center-container">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Your Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column - Stats & Info */}
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-3)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-1)', marginBottom: '1.5rem' }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          
          <h2 style={{ fontSize: '1rem', color: 'var(--text-1)', fontWeight: '700', marginBottom: '0.2rem' }}>{user?.email}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>Member since {stats.joinedDate}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--surface-2)', padding: '1rem', textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-1)', display: 'block' }}>{stats.sessionCount}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Interviews</span>
            </div>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="form-card" style={{ margin: 0, maxWidth: '100%' }}>
          <form onSubmit={handleSubmit} className="new-session-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                value={profile.name} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="targetRole">Target Role</label>
                <input 
                  type="text" 
                  id="targetRole" 
                  placeholder="e.g. Senior Frontend Engineer" 
                  value={profile.targetRole} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="targetCompany">Target Company (Optional)</label>
                <input 
                  type="text" 
                  id="targetCompany" 
                  placeholder="e.g. Google, Stripe" 
                  value={profile.targetCompany} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Professional Bio</label>
              <textarea 
                id="bio" 
                style={{ minHeight: '100px', resize: 'vertical' }}
                placeholder="Brief summary of your experience..." 
                value={profile.bio} 
                onChange={handleChange}
              ></textarea>
            </div>

            {message.text && (
              <div className={message.type === 'error' ? 'error-message' : 'error-message'} style={message.type === 'success' ? { background: 'rgba(34,197,94,0.08)', borderColor: '#22c55e', color: '#4ade80' } : {}}>
                {message.text}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;
