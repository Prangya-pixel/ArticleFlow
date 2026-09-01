import crypto from 'node:crypto';
import Article from '../models/Article.js';
import Quiz from '../models/Quiz.js';

const editableFields = ['title', 'excerpt', 'body', 'category', 'coverImage'];
const articleResponse = (article) => {
  const data = article.toJSON ? article.toJSON() : article;
  return { ...data, id: data._id, author: data.authorName || data.author };
};

function validateArticle(data) {
  return ['title', 'excerpt', 'body', 'category'].find((field) => !data[field]?.trim());
}

function readMinutes(body) { return Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 200)); }

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
    if (article.status === 'Published') { article.views += 1; await article.save(); }
    return res.json(articleResponse(article));
  } catch (error) { next(error); }
}

export async function createArticle(req, res, next) {
  try {
    const missing = validateArticle(req.body);
    if (missing) return res.status(400).json({ message: `${missing} is required.` });
    const article = await Article.create({
      _id: crypto.randomUUID(), title: req.body.title.trim(), excerpt: req.body.excerpt.trim(), body: req.body.body.trim(),
      category: req.body.category.trim(), tags: (req.body.tags || []).map((tag) => tag.trim()).filter(Boolean),
      coverImage: req.body.coverImage?.trim(), author: req.user._id, authorName: req.user.name,
      readMinutes: readMinutes(req.body.body), status: req.body.submit ? 'Pending' : 'Draft'
    });
    if (Array.isArray(req.body.questions) && req.body.questions.length) {
      await Quiz.create({ articleId: article._id, questions: req.body.questions });
    }
    return res.status(201).json(articleResponse(article));
  } catch (error) { next(error); }
}

export async function updateArticle(req, res, next) {
  try {
    const article = await Article.findOne({ _id: req.params.id, author: req.user._id });
    if (!article) return res.status(404).json({ message: 'Article not found.' });
    if (article.status === 'Pending' || article.status === 'Published') return res.status(400).json({ message: 'This article cannot be edited while under review or published.' });
    for (const field of editableFields) if (req.body[field] !== undefined) article[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
    if (req.body.tags) article.tags = req.body.tags.map((tag) => tag.trim()).filter(Boolean);
    article.readMinutes = readMinutes(article.body);
    article.status = req.body.submit ? 'Pending' : 'Draft';
    await article.save();
    if (Array.isArray(req.body.questions)) await Quiz.findOneAndUpdate({ articleId: article._id }, { questions: req.body.questions }, { upsert: true });
    return res.json(articleResponse(article));
  } catch (error) { next(error); }
}

export async function deleteArticle(req, res, next) {
  try {
    const article = await Article.findOneAndDelete({ _id: req.params.id, author: req.user._id, status: { $in: ['Draft', 'Rejected', 'Changes Requested'] } });
    if (!article) return res.status(404).json({ message: 'Article not found or cannot be deleted.' });
    await Quiz.deleteOne({ articleId: article._id });
    return res.status(204).end();
  } catch (error) { next(error); }
}
