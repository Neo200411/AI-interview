import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axios';

const TIME_LIMIT = 180; // 3 minutes per question

const Interview = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [role, setRole] = useState(location.state?.role || 'Software Engineer');
  const [loading, setLoading] = useState(!questions.length);

  useEffect(() => {
    const resumeSession = async () => {
      if (questions.length > 0) return;

      try {
        const response = await axiosInstance.get(`/api/session/${sessionId}`);
        const sessionData = response.data;
        
        if (sessionData.questions && sessionData.questions.length > 0) {
          setQuestions(sessionData.questions);
          setRole(sessionData.role || 'Software Engineer');
          
          // Resume progress: skip questions already answered
          if (sessionData.answers && sessionData.answers.length > 0) {
            const answeredCount = sessionData.answers.length;
            
            // Map previous evaluations to state
            const previousEvaluations = sessionData.answers.map(ans => ({
              score: ans.score,
              whatWasGood: ans.feedback.split('\n')[0].replace('Good: ', ''),
              whatWasMissing: ans.feedback.split('\n')[1].replace('Missing: ', ''),
              keyTakeaway: ans.feedback.split('\n')[2].replace('Takeaway: ', ''),
              modelAnswer: ans.modelAnswer,
              question: ans.question,
              userAnswer: ans.userAnswer
            }));
            
            setAllEvaluations(previousEvaluations);
            
            if (answeredCount < sessionData.questions.length) {
              setCurrentIndex(answeredCount);
            } else {
              // If all answered, go to results
              navigate(`/session/${sessionId}/results`, { 
                state: { allEvaluations: previousEvaluations, role: sessionData.role } 
              });
            }
          }
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Failed to resume interview session:', err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    resumeSession();
  }, [questions.length, sessionId, navigate]);

  const timerRef = useRef(null);

  if (loading) {
    return (
      <div className="container center-container">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Resuming session...</p>
        </div>
      </div>
    );
  }

  // Fallback if still no questions
  if (!questions.length) {
    return (
      <div className="container center-container">
        <div className="empty-state">
          <p>No questions found. Please start a new session.</p>
          <button className="btn-primary" onClick={() => navigate('/session/new')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Timer Effect
  useEffect(() => {
    if (timeEnabled && !evaluation && !isEvaluating) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitAnswer(true); // Auto submit on zero
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeEnabled, evaluation, isEvaluating, currentIndex]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 30) return '#ef4444'; // Red
    if (timeLeft <= 60) return '#f59e0b'; // Amber
    return 'var(--text-3)';
  };

  const handleGetHint = async () => {
    setIsHinting(true);
    try {
      const response = await axiosInstance.post('/api/session/hint', { question: currentQuestion });
      setHint(response.data.hint);
    } catch (err) {
      console.error(err);
      setHint('Could not load hint at this time.');
    } finally {
      setIsHinting(false);
    }
  };

  const handleGetFollowUp = async () => {
    setIsFollowGenerating(true);
    try {
      const response = await axiosInstance.post('/api/session/followup', { 
        question: currentQuestion, 
        userAnswer 
      });
      setFollowUpQuestion(response.data.followUpQuestion);
    } catch (err) {
      console.error(err);
      setFollowUpQuestion('Could not load follow-up question at this time.');
    } finally {
      setIsFollowGenerating(false);
    }
  };

  const handleSubmitAnswer = async (autoSubmit = false) => {
    if (!autoSubmit && userAnswer.length < 10) {
      setError('Your answer must be at least 10 characters long.');
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setError(null);
    setIsEvaluating(true);

    try {
      const response = await axiosInstance.post('/api/session/evaluate', {
        sessionId,
        question: currentQuestion,
        // Send a default if auto-submitted empty
        userAnswer: userAnswer.trim() === '' ? '(Candidate ran out of time and submitted blank)' : userAnswer
      });
      
      setEvaluation(response.data);
      setShowModelAnswer(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    setAllEvaluations([...allEvaluations, evaluation]);
    setUserAnswer('');
    setEvaluation(null);
    setError(null);
    setHint('');
    setFollowUpQuestion('');
    setTimeLeft(TIME_LIMIT);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleFinish = async () => {
    const finalEvaluations = [...allEvaluations, evaluation];
    try {
      await axiosInstance.post('/api/session/finish', { sessionId });
      navigate(`/session/${sessionId}/results`, { state: { allEvaluations: finalEvaluations, role } });
    } catch (err) {
      setError('Failed to finish session. Results are saved, but couldn\'t mark as complete.');
      setTimeout(() => {
        navigate(`/session/${sessionId}/results`, { state: { allEvaluations: finalEvaluations, role } });
      }, 2000);
    }
  };

  const getScoreColor = (score) => {
    if (score < 5) return 'text-red';
    if (score < 8) return 'text-amber';
    return 'text-green';
  };

  return (
    <div className="container interview-container">
      <div className="progress-container">
        <div className="progress-text">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="interview-main">
        <div className="question-card" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2>Current Question</h2>
            {!evaluation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={timeEnabled} 
                    onChange={(e) => setTimeEnabled(e.target.checked)} 
                    disabled={isEvaluating}
                  />
                  Timed Mode
                </label>
                {timeEnabled && (
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: getTimerColor(), fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(timeLeft)}
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="question-text">{currentQuestion}</p>
          
          {!evaluation && !hint && (
            <button 
              className="btn-ghost" 
              style={{ marginTop: '1rem', padding: '0.4rem 0.8rem' }}
              onClick={handleGetHint}
              disabled={isHinting || isEvaluating}
            >
              {isHinting ? 'Loading hint...' : '💡 Get a hint'}
            </button>
          )}

          {hint && (
            <div className="fade-in" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-2)' }}>
              <span style={{ fontWeight: '600', color: 'var(--accent)' }}>💡 Hint:</span> {hint}
            </div>
          )}
        </div>

        {!evaluation ? (
          <div className="answer-section fade-in">
            <textarea
              className="answer-textarea"
              placeholder="Type your answer here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isEvaluating}
            ></textarea>

            {error && <div className="error-message">{error}</div>}

            <button 
              className="btn-primary btn-large w-full mt-4"
              onClick={() => handleSubmitAnswer(false)}
              disabled={isEvaluating || userAnswer.length < 10}
            >
              {isEvaluating ? 'AI is evaluating...' : 'Submit Answer'}
            </button>
          </div>
        ) : (
          <div className="evaluation-card fade-in">
            <div className="eval-header">
              <h3>AI Evaluation Result</h3>
              <div className={`eval-score ${getScoreColor(evaluation.score)}`}>
                <span className="score-num">{evaluation.score}</span>/10
              </div>
            </div>

            <div className="eval-feedback">
              <div className="feedback-section good-section">
                <h4>What was good</h4>
                <p>{evaluation.whatWasGood}</p>
              </div>
              
              <div className="feedback-section missing-section">
                <h4>What was missing</h4>
                <p>{evaluation.whatWasMissing}</p>
              </div>

              <div className="feedback-section takeaway-section">
                <h4>Key takeaway</h4>
                <p>{evaluation.keyTakeaway}</p>
              </div>
            </div>

            {/* Follow-up Section */}
            {!followUpQuestion ? (
              <button 
                className="btn-outline w-full mb-4"
                onClick={handleGetFollowUp}
                disabled={isFollowGenerating}
              >
                {isFollowGenerating ? 'Generating...' : 'Prepare for a Follow-up Question →'}
              </button>
            ) : (
              <div className="fade-in" style={{ marginBottom: '1.25rem', padding: '1.25rem', background: 'var(--surface-2)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius)' }}>
                <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: '0.5rem' }}>Follow-up Question</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-1)', lineHeight: '1.6' }}>{followUpQuestion}</p>
                <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  (This is for self-reflection and not evaluated. Think about how you'd answer it before moving on!)
                </div>
              </div>
            )}

            <div className="model-answer-wrapper">
              <button 
                className="btn-ghost toggle-model-btn"
                onClick={() => setShowModelAnswer(!showModelAnswer)}
              >
                {showModelAnswer ? 'Hide example answer' : 'Show an ideal example answer'}
              </button>
              
              {showModelAnswer && (
                <div className="model-answer-content fade-in">
                  {evaluation.modelAnswer}
                </div>
              )}
            </div>

            <div className="eval-actions" style={{ display: 'flex', gap: '0.75rem' }}>
              {!isLastQuestion ? (
                <button className="btn-primary flex-1" onClick={handleNext}>Next Question</button>
              ) : (
                <button className="btn-primary flex-1" onClick={handleFinish}>Finish Session & See Results</button>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Interview;
