const express = require('express');
const router = express.Router();
const { ChatGroq } = require('@langchain/groq');
const { HumanMessage } = require('@langchain/core/messages');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// Initialize ChatGroq
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
});

// POST /generate
router.post('/generate', auth, async (req, res) => {
  try {
    const { jobDescription, role = 'Software Engineer', difficulty = 'Mid' } = req.body;

    if (!jobDescription || jobDescription.length < 50) {
      return res.status(400).json({ message: 'Job description is required and must be at least 50 characters long.' });
    }

    const difficultyGuide = {
      Junior: 'Focus on fundamentals, basic concepts, and simple problem-solving. Avoid deep system design.',
      Mid: 'Balance between conceptual depth and practical application. Include some system design thinking.',
      Senior: 'Expect deep technical mastery, architectural decisions, trade-offs, and leadership scenarios.',
    };

    const promptText = `You are an expert technical interviewer at a top tech company.

Job Description: ${jobDescription}
Role: ${role}
Candidate Level: ${difficulty}
Level Guidance: ${difficultyGuide[difficulty] || difficultyGuide.Mid}

Generate exactly 5 interview questions tailored to a ${difficulty}-level ${role}.
Include a mix of: technical questions specific to the JD, problem-solving questions, and 1 behavioural question.
Calibre questions appropriately for the ${difficulty} level — not too easy, not too hard.

Return ONLY a valid JSON array of 5 strings. No explanation, no markdown, just the JSON array.
Example format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    const aiResponse = await llm.invoke([new HumanMessage(promptText)]);
    const response = aiResponse.content;

    let questions;
    try {
      questions = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      return res.status(500).json({ message: 'AI returned invalid format, please try again' });
    }

    if (!Array.isArray(questions) || questions.length !== 5) {
      return res.status(500).json({ message: 'AI returned invalid format, please try again' });
    }

    const newSession = new Session({
      userId: req.user.id,
      jobDescription,
      role,
      difficulty,
      questions,
    });

    const savedSession = await newSession.save();

    return res.status(201).json({
      sessionId: savedSession._id,
      questions,
      role,
      difficulty,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /history
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(sessions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /evaluate
router.post('/evaluate', auth, async (req, res) => {
  try {
    const { sessionId, question, userAnswer } = req.body;

    // Validate request
    if (!sessionId || !question || !userAnswer) {
      return res.status(400).json({ message: 'Session ID, question, and user answer are required.' });
    }
    
    if (userAnswer.length < 10) {
      return res.status(400).json({ message: 'User answer must be at least 10 characters long.' });
    }

    // Find session and verify ownership
    const session = await Session.findById(sessionId);
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found or access denied.' });
    }

    const promptText = `You are an expert technical interviewer evaluating a candidate's interview answer.

Question: ${question}

Candidate's Answer: ${userAnswer}

Evaluate this answer fairly and thoroughly. Consider: technical accuracy, depth of knowledge, communication clarity, and completeness.

Return ONLY a valid JSON object with exactly these keys, no explanation, no markdown:
{
  "score": <number between 0 and 10>,
  "whatWasGood": "<string>",
  "whatWasMissing": "<string>",
  "modelAnswer": "<string>",
  "keyTakeaway": "<string>"
}`;

    const aiResponse = await llm.invoke([new HumanMessage(promptText)]);
    const response = aiResponse.content;

    let evaluation;
    try {
      evaluation = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI evaluation:', response);
      return res.status(500).json({ message: 'AI returned invalid format, please try again' });
    }

    // Construct the answer object directly mapping to schema
    const newAnswer = {
      question,
      userAnswer,
      score: evaluation.score || 0,
      feedback: `Good: ${evaluation.whatWasGood}\nMissing: ${evaluation.whatWasMissing}\nTakeaway: ${evaluation.keyTakeaway}`,
      modelAnswer: evaluation.modelAnswer
    };

    // Push the new answer
    session.answers.push(newAnswer);

    // Recalculate overall score
    const totalScore = session.answers.reduce((acc, current) => acc + (current.score || 0), 0);
    session.overallScore = totalScore / session.answers.length;

    // Save session using standard save method instead of $push to let Mongoose handle nested schema and recalculations correctly
    await session.save();

    // Return the full evaluation object as requested
    return res.status(200).json(evaluation);

  } catch (error) {
    console.error('=== /evaluate ERROR ===', error.message || error);
    return res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

// POST /finish
router.post('/finish', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required.' });
    }

    const session = await Session.findById(sessionId);
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found or access denied.' });
    }

    session.completedAt = new Date();
    await session.save();

    return res.status(200).json({ message: 'Session completed successfully', session });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /hint
router.post('/hint', auth, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'Question is required' });

    const promptText = `Provide a very brief hint (1-2 sentences max) for this interview question. Guide the candidate on what direction to take, but absolutely do not reveal the actual answer.\n\nQuestion: "${question}"`;
    const aiResponse = await llm.invoke([new HumanMessage(promptText)]);
    
    return res.status(200).json({ hint: aiResponse.content.trim() });
  } catch (error) {
    console.error('=== /hint ERROR ===', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /followup
router.post('/followup', auth, async (req, res) => {
  try {
    const { question, userAnswer } = req.body;
    if (!question || !userAnswer) return res.status(400).json({ message: 'Question and userAnswer are required' });

    const promptText = `You are a tough but fair technical interviewer. The candidate just answered a question. Based on their answer, generate EXACTLY ONE sharp, specific follow-up question that goes deeper, asks for an example, or challenges a weak point in their answer.\n\nOriginal Question: "${question}"\nCandidate Answer: "${userAnswer}"\n\nReturn ONLY the text of the follow-up question.`;
    const aiResponse = await llm.invoke([new HumanMessage(promptText)]);
    
    return res.status(200).json({ followUpQuestion: aiResponse.content.trim() });
  } catch (error) {
    console.error('=== /followup ERROR ===', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
