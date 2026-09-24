import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Article from '../models/Article.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { analyzeContent } from '../services/moderationService.js';

const editableFields = ['title', 'excerpt', 'body', 'category', 'coverImage'];

const articleResponse = (article) => {
  const data = article.toJSON ? article.toJSON() : article;

  return {
    ...data,
    id: data._id?.toString(),
    _id: data._id?.toString(),
    authorId: data.author,
    author: data.authorName || data.author,
    excerpt: data.excerpt || '',
    body: data.body || data.content || '',
    coverImage: data.coverImage || data.image || '',
  };
};

async function withEngagement(article) {
  const response = articleResponse(article);

  response.likesCount = response.likesCount || 0;

  response.commentsCount = await Comment.countDocuments({
    articleId: String(article._id),
  });

  return response;
}

function validateArticle(data) {
  return ['title', 'excerpt', 'body', 'category'].find(
    (field) => !data[field]?.trim()
  );
}

function readMinutes(body) {
  return Math.max(
    1,
    Math.ceil(body.trim().split(/\s+/).length / 200)
  );
}

/*
 * Convert moderation flags into human-readable
 * spam/content moderation reasons.
 */
function getSpamReasons(analysis) {
  const reasons = [];

  if (analysis.flags?.spam) {
    reasons.push('Spam or promotional content detected.');
  }

  if (analysis.flags?.suspiciousLinks) {
    reasons.push('Suspicious link detected.');
  }

  if (analysis.flags?.pii) {
    reasons.push('Potential personal information detected.');
  }

  if (analysis.flags?.toxic) {
    reasons.push('Toxic or harassing content detected.');
  }

  if (analysis.flags?.hateSpeech) {
    reasons.push('Potential hate speech detected.');
  }

  if (analysis.flags?.violence) {
    reasons.push('Potential violent content detected.');
  }

  if (analysis.flags?.inappropriate) {
    reasons.push('Potential inappropriate content detected.');
  }

  return reasons;
}

/*
 * Run moderation for submitted article content
 * and return only the data required by Article.
 */
async function analyzeArticleForSpam(title, excerpt, body) {
  const analysis = await analyzeContent({
    title,
    content: `${excerpt}\n${body}`,
  });

  const reasons = getSpamReasons(analysis);

  return {
    spamStatus: reasons.length > 0 ? 'Flagged' : 'Clean',
    spamScore: analysis.riskScore,
    spamReasons: reasons,
  };
}

async function notifyAdminsAboutSubmission(article) {
  const admins = await User.find({ role: 'admin' }).select('_id');

  if (admins.length) {
    await Notification.insertMany(
      admins.map((admin) => ({
        recipient: admin._id,
        article: article._id,
        type: 'SUBMITTED',
        message: `"${article.title}" was submitted by ${article.authorName} and is ready for review.`,
      }))
    );
  }
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) return null;

  for (const question of questions) {
    if (
      !question.id ||
      !question.text?.trim() ||
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.some((option) => !option?.trim()) ||
      !Number.isInteger(question.correctAnswerIndex) ||
      question.correctAnswerIndex < 0 ||
      question.correctAnswerIndex >= question.options.length ||
      !question.explanation?.trim()
    ) {
      return 'Each quiz question needs text, at least two options, a correct answer, and an explanation.';
    }
  }

  return null;
}

export async function listArticles(req, res, next) {
  try {
    const query = {};

    if (req.user?.role === 'author') {
      query.author = req.user._id;
    } else if (req.user?.role !== 'admin') {
      query.status = 'Published';
    }

    if (req.query.status && req.user?.role === 'admin') {
      query.status = req.query.status;
    }

    if (req.query.category) {
      query.category = new RegExp(
        `^${req.query.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        'i'
      );
    }

    if (req.query.search?.trim()) {
      query.$text = { $search: req.query.search.trim() };
    }

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(await Promise.all(articles.map(withEngagement)));
  } catch (error) {
    next(error);
  }
}

export async function getArticle(req, res, next) {
  try {
    const { id } = req.params;

    let article;

    if (mongoose.Types.ObjectId.isValid(id)) {
      article = await Article.collection.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });
    }

    if (!article) {
      article = await Article.collection.findOne({
        _id: id,
      });
    }

    if (!article) {
      return res.status(404).json({
        message: 'Article not found.',
      });
    }

    const ownsArticle =
      req.user &&
      String(article.author) === String(req.user._id);

    if (
      article.status !== 'Published' &&
      req.user?.role !== 'admin' &&
      !ownsArticle
    ) {
      return res.status(404).json({
        message: 'Article not found.',
      });
    }

    if (
      article.status === 'Published' &&
      req.user?.role === 'reader'
    ) {
      await Article.collection.updateOne(
        { _id: article._id },
        { $inc: { views: 1 } }
      );

      article.views = (article.views || 0) + 1;
    }

    const response = await withEngagement(article);

    if (req.user?.role === 'reader') {
      response.isSaved =
        req.user.savedArticles?.some(
          (savedId) =>
            String(savedId) === String(article._id)
        ) || false;
    }

    if (req.user) {
      const existingLike = await Like.findOne({
        user: req.user._id,
        article: article._id,
      });

      response.isLiked = !!existingLike;
    }

    return res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getSavedArticles(req, res, next) {
  try {
    const articles = await Article.find({
      _id: { $in: req.user.savedArticles || [] },
      status: 'Published',
    }).sort({ publishedAt: -1 });

    const responses = await Promise.all(
      articles.map(withEngagement)
    );

    return res.json(
      responses.map((article) => ({
        ...article,
        isSaved: true,
      }))
    );
  } catch (error) {
    next(error);
  }
}

export async function getReviewedArticles(req, res, next) {
  try {
    const articles = await Article.find({
      reviewedBy: req.user._id,
      status: { $in: ['Published', 'Rejected'] },
    }).sort({ reviewedAt: -1 });

    return res.json(
      await Promise.all(articles.map(withEngagement))
    );
  } catch (error) {
    next(error);
  }
}

export async function toggleSavedArticle(req, res, next) {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      status: 'Published',
    });

    if (!article) {
      return res.status(404).json({
        message: 'Published article not found.',
      });
    }

    const saved = req.user.savedArticles?.includes(article._id);

    if (saved) {
      await User.updateOne(
        { _id: req.user._id },
        { $pull: { savedArticles: article._id } }
      );
    } else {
      await User.updateOne(
        { _id: req.user._id },
        { $addToSet: { savedArticles: article._id } }
      );
    }

    return res.json({
      saved: !saved,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleLike(req, res, next) {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      status: 'Published',
    });

    if (!article) {
      return res.status(404).json({
        message: 'Published article not found.',
      });
    }

    const existing = await Like.findOne({
      user: req.user._id,
      article: article._id,
    });

    if (existing) {
      await Like.deleteOne({
        _id: existing._id,
      });

      article.likesCount = Math.max(
        0,
        (article.likesCount || 0) - 1
      );

      await article.save();

      return res.json({
        liked: false,
        likesCount: article.likesCount,
      });
    }

    await Like.create({
      user: req.user._id,
      article: article._id,
    });

    article.likesCount = (article.likesCount || 0) + 1;

    await article.save();

    if (String(article.author) !== String(req.user._id)) {
      await Notification.create({
        recipient: article.author,
        article: article._id,
        type: 'LIKED',
        message: `${req.user.name} liked your article "${article.title}".`,
      });
    }

    return res.json({
      liked: true,
      likesCount: article.likesCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function createArticle(req, res, next) {
  try {
    const missing = validateArticle(req.body);

    if (missing) {
      return res.status(400).json({
        message: `${missing} is required.`,
      });
    }

    const questionError = validateQuestions(req.body.questions);

    if (questionError) {
      return res.status(400).json({
        message: questionError,
      });
    }

    const title = req.body.title.trim();
    const excerpt = req.body.excerpt.trim();
    const body = req.body.body.trim();

    let spamData = {
      spamStatus: 'Not Checked',
      spamScore: null,
      spamReasons: [],
    };

    /*
     * Only run spam analysis when the author
     * actually submits the article for review.
     */
    if (req.body.submit) {
      spamData = await analyzeArticleForSpam(
        title,
        excerpt,
        body
      );
    }

    const article = await Article.create({
      _id: crypto.randomUUID(),

      title,
      excerpt,
      body,

      category: req.body.category.trim(),

      tags: (req.body.tags || [])
        .map((tag) => tag.trim())
        .filter(Boolean),

      coverImage: req.body.coverImage?.trim(),

      author: req.user._id,
      authorName: req.user.name,

      readMinutes: readMinutes(body),

      status: req.body.submit ? 'Pending' : 'Draft',

      spamStatus: spamData.spamStatus,
      spamScore: spamData.spamScore,
      spamReasons: spamData.spamReasons,
    });

    if (
      Array.isArray(req.body.questions) &&
      req.body.questions.length
    ) {
      await Quiz.create({
        articleId: article._id,
        questions: req.body.questions,
      });
    }

    if (article.status === 'Pending') {
      await notifyAdminsAboutSubmission(article);
    }

    return res.status(201).json(
      articleResponse(article)
    );
  } catch (error) {
    next(error);
  }
}

export async function updateArticle(req, res, next) {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      author: req.user._id,
    });

    if (!article) {
      return res.status(404).json({
        message: 'Article not found.',
      });
    }

    if (article.status === 'Pending') {
      return res.status(400).json({
        message: 'This article cannot be edited while under review.',
      });
    }

    const questionError = validateQuestions(req.body.questions);

    if (questionError) {
      return res.status(400).json({
        message: questionError,
      });
    }

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        article[field] =
          typeof req.body[field] === 'string'
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    if (req.body.tags) {
      article.tags = req.body.tags
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    article.readMinutes = readMinutes(article.body);

    /*
     * Re-run spam analysis when an edited article
     * is submitted again.
     */
    if (req.body.submit) {
      const spamData = await analyzeArticleForSpam(
        article.title,
        article.excerpt,
        article.body
      );

      article.spamStatus = spamData.spamStatus;
      article.spamScore = spamData.spamScore;
      article.spamReasons = spamData.spamReasons;

      article.spamReviewedBy = undefined;
      article.spamReviewedAt = undefined;
    }

    article.status = 'Pending';

    await article.save();

    if (Array.isArray(req.body.questions)) {
      if (req.body.questions.length) {
        await Quiz.findOneAndUpdate(
          { articleId: article._id },
          { questions: req.body.questions },
          { upsert: true }
        );
      } else {
        await Quiz.deleteOne({
          articleId: article._id,
        });
      }
    }

    await notifyAdminsAboutSubmission(article);

    return res.json(
      articleResponse(article)
    );
  } catch (error) {
    next(error);
  }
}

export async function deleteArticle(req, res, next) {
  try {
    const article = await Article.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
      status: { $ne: 'Pending' },
    });

    if (!article) {
      return res.status(404).json({
        message: 'Article not found or cannot be deleted.',
      });
    }

    await Quiz.deleteOne({
      articleId: article._id,
    });

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function getSpamArticles(req, res, next) {
  try {
    const articles = await Article.find({
      spamStatus: { $in: ['Flagged', 'Not Checked'] },
      status: 'Pending',
    }).sort({ createdAt: -1 });

    return res.json({
      articles: await Promise.all(
        articles.map(withEngagement)
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewSpamArticle(req, res, next) {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({
        message: 'Decision must be Approved or Rejected.',
      });
    }

    const article = await Article.findOne({
      _id: id,
      status: 'Pending',
    });

    if (!article) {
      return res.status(404).json({
        message: 'Pending article not found.',
      });
    }

    article.spamStatus = decision;
    article.spamReviewedBy = req.user._id;
    article.spamReviewedAt = new Date();

    if (decision === 'Approved') {
      article.status = 'Approved';
    }

    if (decision === 'Rejected') {
      article.status = 'Rejected';
    }

    article.reviewedBy = req.user._id;
    article.reviewedAt = new Date();

    await article.save();

    return res.json({
      message:
        decision === 'Approved'
          ? 'Article approved successfully.'
          : 'Article rejected successfully.',
      article: articleResponse(article),
    });
  } catch (error) {
    next(error);
  }
}