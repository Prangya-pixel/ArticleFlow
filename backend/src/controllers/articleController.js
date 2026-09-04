import crypto from 'node:crypto';
import Article from '../models/Article.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const editableFields = ['title', 'excerpt', 'body', 'category', 'coverImage'];
const articleResponse = (article) => {
  const data = article.toJSON ? article.toJSON() : article;
  return { ...data, id: data._id, author: data.authorName || data.author };
};

function validateArticle(data) {
  return ['title', 'excerpt', 'body', 'category'].find((field) => !data[field]?.trim());
}

function readMinutes(body) { return Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 200)); }

async function notifyAdminsAboutSubmission(article) {
  const admins = await User.find({ role: 'admin' }).select('_id');
  if (admins.length) await Notification.insertMany(admins.map((admin) => ({ recipient: admin._id, article: article._id, type: 'SUBMITTED', message: `"${article.title}" was submitted by ${article.authorName} and is ready for review.` })));
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) return null;
  for (const question of questions) {
    if (!question.id || !question.text?.trim() || !Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => !option?.trim()) || !Number.isInteger(question.correctAnswerIndex) || question.correctAnswerIndex < 0 || question.correctAnswerIndex >= question.options.length || !question.explanation?.trim()) return 'Each quiz question needs text, at least two options, a correct answer, and an explanation.';
  }
  return null;
}

export async function listArticles(req, res, next) {
  try {
    const query = {};
    if (req.user?.role === 'author') query.author = req.user._id;
    else if (req.user?.role !== 'admin') query.status = 'Published';
    if (req.query.status && req.user?.role === 'admin') query.status = req.query.status;
    if (req.query.category) query.category = new RegExp(`^${req.query.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (req.query.search?.trim()) query.$text = { $search: req.query.search.trim() };
    const articles = await Article.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(articles.map(articleResponse));
  } catch (error) { next(error); }
}

export async function getArticle(req, res, next) {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found.' });
    const ownsArticle = req.user && String(article.author) === String(req.user._id);
    if (article.status !== 'Published' && req.user?.role !== 'admin' && !ownsArticle) return res.status(404).json({ message: 'Article not found.' });
    // Only real reader visits contribute to the public view count. Author and
    // admin visits are previews or management activity and must not inflate it.
    if (article.status === 'Published' && req.user?.role === 'reader') {
      article.views += 1;
      await article.save();
    }
    const response = articleResponse(article);
    if (req.user?.role === 'reader') response.isSaved = req.user.savedArticles?.includes(article._id) || false;
    return res.json(response);
  } catch (error) { next(error); }
}

export async function getSavedArticles(req, res, next) {
  try {
    const articles = await Article.find({ _id: { $in: req.user.savedArticles || [] }, status: 'Published' }).sort({ publishedAt: -1 });
    return res.json(articles.map((article) => ({ ...articleResponse(article), isSaved: true })));
  } catch (error) { next(error); }
}

export async function toggleSavedArticle(req, res, next) {
  try {
    const article = await Article.findOne({ _id: req.params.id, status: 'Published' });
    if (!article) return res.status(404).json({ message: 'Published article not found.' });
    const saved = req.user.savedArticles?.includes(article._id);
    if (saved) await User.updateOne({ _id: req.user._id }, { $pull: { savedArticles: article._id } });
    else await User.updateOne({ _id: req.user._id }, { $addToSet: { savedArticles: article._id } });
    return res.json({ saved: !saved });
  } catch (error) { next(error); }
}

export async function createArticle(req, res, next) {
  try {
    const missing = validateArticle(req.body);
    if (missing) return res.status(400).json({ message: `${missing} is required.` });
    const questionError = validateQuestions(req.body.questions);
    if (questionError) return res.status(400).json({ message: questionError });
    const article = await Article.create({
      _id: crypto.randomUUID(), title: req.body.title.trim(), excerpt: req.body.excerpt.trim(), body: req.body.body.trim(),
      category: req.body.category.trim(), tags: (req.body.tags || []).map((tag) => tag.trim()).filter(Boolean),
      coverImage: req.body.coverImage?.trim(), author: req.user._id, authorName: req.user.name,
      readMinutes: readMinutes(req.body.body), status: req.body.submit ? 'Pending' : 'Draft'
    });
    if (Array.isArray(req.body.questions) && req.body.questions.length) {
      await Quiz.create({ articleId: article._id, questions: req.body.questions });
    }
    if (article.status === 'Pending') await notifyAdminsAboutSubmission(article);
    return res.status(201).json(articleResponse(article));
  } catch (error) { next(error); }
}

export async function updateArticle(req, res, next) {
  try {
    const article = await Article.findOne({ _id: req.params.id, author: req.user._id });
    if (!article) return res.status(404).json({ message: 'Article not found.' });
    if (article.status === 'Pending') return res.status(400).json({ message: 'This article cannot be edited while under review.' });
    const questionError = validateQuestions(req.body.questions);
    if (questionError) return res.status(400).json({ message: questionError });
    for (const field of editableFields) if (req.body[field] !== undefined) article[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
    if (req.body.tags) article.tags = req.body.tags.map((tag) => tag.trim()).filter(Boolean);
    article.readMinutes = readMinutes(article.body);
    article.status = 'Pending';
    await article.save();
    if (Array.isArray(req.body.questions)) {
      if (req.body.questions.length) await Quiz.findOneAndUpdate({ articleId: article._id }, { questions: req.body.questions }, { upsert: true });
      else await Quiz.deleteOne({ articleId: article._id });
    }
    await notifyAdminsAboutSubmission(article);
    return res.json(articleResponse(article));
  } catch (error) { next(error); }
}

export async function deleteArticle(req, res, next) {
  try {
    const article = await Article.findOneAndDelete({ _id: req.params.id, author: req.user._id, status: { $ne: 'Pending' } });
    if (!article) return res.status(404).json({ message: 'Article not found or cannot be deleted.' });
    await Quiz.deleteOne({ articleId: article._id });
    return res.status(204).end();
  } catch (error) { next(error); }
}
