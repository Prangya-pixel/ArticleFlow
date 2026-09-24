import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  articleId: { type: String, ref: 'Article', required: true },
  answers: { type: mongoose.Schema.Types.Mixed, required: true }, // { questionId: selectedIndex }
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true }
}, { 
  timestamps: { createdAt: 'attemptedAt', updatedAt: false }, // map createdAt to attemptedAt
  versionKey: false 
});

export default mongoose.model('QuizAttempt', quizAttemptSchema);
