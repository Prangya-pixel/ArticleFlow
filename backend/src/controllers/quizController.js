import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Article from '../models/Article.js';

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
