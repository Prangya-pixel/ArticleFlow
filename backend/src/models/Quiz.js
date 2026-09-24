import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswerIndex: { type: Number, required: true },
  explanation: { type: String, required: true }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  articleId: { type: String, required: true, ref: 'Article' },
  questions: { type: [questionSchema], required: true }
}, { 
  timestamps: true, 
  versionKey: false 
});

export default mongoose.model('Quiz', quizSchema);
