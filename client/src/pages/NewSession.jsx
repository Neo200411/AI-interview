import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'ML Engineer',
  'DevOps Engineer'
];

const DIFFICULTIES = ['Junior', 'Mid', 'Senior'];

const NewSession = () => {
  const [role, setRole] = useState(ROLES[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.targetRole && ROLES.includes(user.targetRole)) {
      setRole(user.targetRole);
    }
  }, [user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axiosInstance.post('/api/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setJobDescription(response.data.extractedText);
    } catch (err) {
      setError(err.response?.data?.message || 'Error extracting text from PDF.');
    } finally {
      setUploading(false);
      // Reset input so the same file could be selected again if needed
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!jobDescription || jobDescription.length < 50) {
      setError('Job description must be at least 50 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/api/session/generate', {
        jobDescription,
        role,
        difficulty
      });

      navigate(`/session/${response.data.sessionId}/interview`, { 
        state: { 
          questions: response.data.questions,
          role: response.data.role || role,
          difficulty: response.data.difficulty || difficulty
        } 
      });

    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to generate questions. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="container center-container">
      <div className="form-card">
        <h1>Start New Interview</h1>
        <p className="subtitle">Paste a job description or upload a PDF, select your role, and choose the difficulty.</p>

        <form onSubmit={handleSubmit} className="new-session-form">
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="role">Target Role</label>
              <select 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="role-selector"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="difficulty">Difficulty</label>
              <select 
                id="difficulty" 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                className="role-selector"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.2rem' }}>
              <label htmlFor="jobDescription">Job Description or Resume text</label>
              <button 
                type="button" 
                className="btn-ghost" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
              >
                {uploading ? 'Extracting...' : 'Upload PDF'}
              </button>
              <input 
                type="file" 
                accept="application/pdf" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </div>
            
            <textarea
              id="jobDescription"
              className="jd-textarea"
              placeholder="Paste the full job description or upload your resume PDF to extract text..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={loading || uploading}
            ></textarea>
            
            <div className={`char-counter ${jobDescription.length < 50 ? 'text-red' : 'text-green'}`}>
              {jobDescription.length} characters (minimum 50 required)
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="btn-primary btn-large" 
            disabled={loading || uploading || jobDescription.length < 50}
          >
             {loading ? 'Generating questions...' : 'Generate Questions'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewSession;
