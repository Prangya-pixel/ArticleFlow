import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Article from '../models/Article.js';

function validateQuestions(questions) {
  if (!Array.isArray(questions) || !questions.length) return 'Add at least one quiz question.';
  for (const question of questions) {
    if (!question.id || !question.text?.trim() || !Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => !option?.trim()) || !Number.isInteger(question.correctAnswerIndex) || question.correctAnswerIndex < 0 || question.correctAnswerIndex >= question.options.length || !question.explanation?.trim()) return 'Each quiz question needs text, options, a correct answer, and an explanation.';
  }
  return null;
}

export async function getQuiz(req, res, next) {
  try { const quiz = await Quiz.findOne({ articleId: req.params.articleId }); return res.json(quiz); } catch (error) { next(error); }
}
export async function submitAttempt(req, res, next) {
  try {
    const quiz = await Quiz.findOne({ articleId: req.params.articleId });
    const article = await Article.findById(req.params.articleId);
    if (!quiz || !article || article.status !== 'Published') return res.status(404).json({ message: 'Quiz not found.' });
    const answers = req.body.answers || {};
    let score = 0;
    const review = quiz.questions.map((question) => { const selectedAnswerIndex = answers[question.id]; const isCorrect = selectedAnswerIndex === question.correctAnswerIndex; if (isCorrect) score++; return { ...question.toObject(), selectedAnswerIndex, isCorrect }; });
    const percentage = Math.round((score / quiz.questions.length) * 100);
    await QuizAttempt.create({ userId: req.user._id, quizId: quiz._id, articleId: article._id, answers, score, totalQuestions: quiz.questions.length, percentage });
    return res.json({ score, totalQuestions: quiz.questions.length, percentage, review });
  } catch (error) { next(error); }
}

export async function updateQuiz(req, res, next) {
  try {
    const article = await Article.findById(req.params.articleId);
    if (!article) return res.status(404).json({ message: 'Article not found.' });
    const message = validateQuestions(req.body.questions);
    if (message) return res.status(400).json({ message });
    const questions = req.body.questions.map((question) => ({ ...question, text: question.text.trim(), options: question.options.map((option) => option.trim()), explanation: question.explanation.trim() }));
    const quiz = await Quiz.findOneAndUpdate({ articleId: article._id }, { questions }, { new: true, upsert: true, runValidators: true });
    return res.json(quiz);
  } catch (error) { next(error); }
}
