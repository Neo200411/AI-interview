const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  // Position of the question in session.questions; one answer per index
  questionIndex: Number,
  question: String,
  userAnswer: String,
  score: {
    type: Number,
    min: 0,
    max: 10
  },
  feedback: String,
  modelAnswer: String
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'Software Engineer'
  },
  difficulty: {
    type: String,
    default: 'Mid'
  },
  targetCompany: {
    type: String,
    default: ''
  },
  questions: {
    type: [String],
    default: []
  },
  answers: {
    type: [answerSchema],
    default: []
  },
  overallScore: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
