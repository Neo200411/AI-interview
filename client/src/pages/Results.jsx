import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const Results = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [evaluations, setEvaluations] = useState([]);
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [expandedModels, setExpandedModels] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (location.state?.allEvaluations) {
      setEvaluations(location.state.allEvaluations);
    } else {
      // If accessed directly without state, we should ideally fetch from backend,
      // but for this flow we'll redirect back to dashboard if missing
      navigate('/dashboard');
    }
  }, [location, navigate]);

  if (!evaluations.length) {
    return <div className="container">Loading results...</div>;
  }

  // Calculate aggregates
  const totalScore = evaluations.reduce((acc, curr) => acc + (curr?.score || 0), 0);
  const averageScore = (totalScore / evaluations.length).toFixed(1);
  const bestScore = Math.max(...evaluations.map(e => e?.score || 0));

  const getScoreColor = (score) => {
    if (score < 5) return '#ef4444'; // Red
    if (score < 8) return '#f59e0b'; // Amber
    return '#22c55e'; // Green
  };

  const getMotivationalMessage = (score) => {
    if (score >= 8) return "Outstanding performance! You're ready for the real deal.";
    if (score >= 6) return "Good job! A little more practice and you'll nail it.";
    return "Keep practicing! Every interview is a stepping stone to success.";
  };

  const toggleAnswer = (index) => {
    setExpandedAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleModel = (index) => {
    setExpandedModels(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const role = location.state?.role || 'Software Engineer';

  const handleShare = async () => {
    const text = `I just completed an AI interview practice session on InterviewPrep AI! Overall score: ${averageScore}/10. Practiced for: ${role}.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container results-container">
      <div className="results-header no-print">
        <div className="header-actions">
          <button className="btn-outline" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <div className="action-buttons">
            <button className="btn-outline" onClick={handleShare}>
              {copySuccess ? 'Copied!' : '📤 Share Results'}
            </button>
            <button className="btn-outline" onClick={handlePrint}>
              🖨️ Save PDF
            </button>
          </div>
        </div>
      </div>

      <div className="overall-summary">
        <div className="score-circle" style={{ borderColor: getScoreColor(averageScore) }}>
          <span className="big-score" style={{ color: getScoreColor(averageScore) }}>
            {averageScore}
          </span>
          <span className="out-of">/10</span>
        </div>
        <h1>{getMotivationalMessage(averageScore)}</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-label">Questions Answered</span>
          <span className="stat-value">{evaluations.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Average Score</span>
          <span className="stat-value" style={{ color: getScoreColor(averageScore) }}>{averageScore}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Best Score</span>
          <span className="stat-value" style={{ color: getScoreColor(bestScore) }}>{bestScore}</span>
        </div>
      </div>

      <div className="detailed-evaluations">
        <h2>Detailed Feedback</h2>
        
        {evaluations.map((evalItem, index) => (
          <div key={index} className="evaluation-card detailed-card">
            <div className="eval-card-header">
              <h3>Question {index + 1}</h3>
              <div 
                className="score-pill" 
                style={{ 
                  backgroundColor: `${getScoreColor(evalItem?.score)}20`,
                  color: getScoreColor(evalItem?.score),
                  border: `1px solid ${getScoreColor(evalItem?.score)}`
                }}
              >
                Score: {evalItem?.score}/10
              </div>
            </div>
            
            <p className="question-text summary-question">{evalItem?.question || 'Question text unavailable'}</p>

            <div className="collapsible-section no-print">
              <button className="toggle-btn" onClick={() => toggleAnswer(index)}>
                {expandedAnswers[index] ? '▼ Hide my answer' : '▶ Show my answer'}
              </button>
              {expandedAnswers[index] && (
                <div className="collapsed-content user-answer">
                  {evalItem?.userAnswer || 'No answer recorded.'}
                </div>
              )}
            </div>
            
            {/* For print layout always show answer */}
            <div className="print-only user-answer mb-4">
              <strong>Your Answer:</strong><br/>
              {evalItem?.userAnswer || 'No answer recorded.'}
            </div>

            <div className="feedback-section good-section">
              <h4>✓ What Was Good</h4>
              <p>{evalItem?.whatWasGood}</p>
            </div>

            <div className="feedback-section missing-section">
              <h4>! What Was Missing</h4>
              <p>{evalItem?.whatWasMissing}</p>
            </div>

            <div className="feedback-section takeaway-section">
              <h4>💡 Key Takeaway</h4>
              <p>{evalItem?.keyTakeaway}</p>
            </div>

            <div className="collapsible-section no-print mt-4">
              <button className="toggle-btn" onClick={() => toggleModel(index)}>
                {expandedModels[index] ? '▼ Hide model answer' : '▶ Show model answer'}
              </button>
              {expandedModels[index] && (
                <div className="collapsed-content model-answer-content">
                  {evalItem?.modelAnswer}
                </div>
              )}
            </div>
            
            {/* For print layout always show model answer */}
            <div className="print-only model-answer-content mb-4 mt-4">
              <strong>Model Answer:</strong><br/>
              {evalItem?.modelAnswer}
            </div>
          </div>
        ))}
      </div>

      <div className="results-footer no-print">
        <button className="btn-primary btn-large" onClick={() => navigate('/session/new')}>
          Start New Interview
        </button>
        <button className="btn-outline btn-large" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Results;
