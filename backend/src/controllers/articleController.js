import mongoose from 'mongoose';
import Article from '../models/Article.js';

const populateArticle = (query) =>
    query
        .populate('author', 'name email role')
        .populate('category', 'name description')
        .populate('tags', 'name description');

// ======================================================
// CREATE ARTICLE / SAVE AS DRAFT
// ======================================================

export async function createArticle(req, res, next) {
    try {
        const {
            title,
            content,
            category,
            tags = [],
            quizEnabled = false,
            quiz,
            image = '',
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'Article title is required.',
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: 'Article content is required.',
            });
        }

        if (!category) {
            return res.status(400).json({
                message: 'Article category is required.',
            });
        }

        if (!mongoose.isValidObjectId(category)) {
            return res.status(400).json({
                message: 'Invalid category ID.',
            });
        }

        if (!Array.isArray(tags)) {
            return res.status(400).json({
                message: 'Tags must be provided as an array.',
            });
        }

        const invalidTag = tags.find(
            (tag) => !mongoose.isValidObjectId(tag)
        );

        if (invalidTag) {
            return res.status(400).json({
                message: 'Invalid tag ID.',
                invalidTag,
            });
        }

        const article = new Article({
            title: title.trim(),
            content: content.trim(),
            category,
            tags,
            author: req.user._id,
            quizEnabled: Boolean(quizEnabled),
            quiz: quiz || { questions: [] },
            image: image || '',
            status: 'Draft',
        });

        const savedArticle = await article.save();

        const populatedArticle = await populateArticle(
            Article.findById(savedArticle._id)
        );

        return res.status(201).json({
            message: 'Article saved as draft successfully.',
            article: populatedArticle,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// GET ALL ARTICLES - ADMIN
// ======================================================

export async function getAllArticles(req, res, next) {
    try {
        const articles = await populateArticle(
            Article.find().sort({ createdAt: -1 })
        );

        return res.status(200).json({
            articles,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// GET SINGLE ARTICLE - ADMIN
// ======================================================

export async function getArticleById(req, res, next) {
    try {
        const article = await populateArticle(
            Article.findById(req.params.id)
        );

        if (!article) {
            return res.status(404).json({
                message: 'Article not found.',
            });
        }

        return res.status(200).json({
            article,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// UPDATE ARTICLE - ADMIN
// ======================================================

export async function updateArticle(req, res, next) {
    try {
        const {
            title,
            content,
            category,
            tags,
            quizEnabled,
            quiz,
            image,
            status,
            adminNote,
        } = req.body;

        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                message: 'Article not found.',
            });
        }

        // -----------------------------
        // TITLE
        // -----------------------------

        if (title !== undefined) {
            if (typeof title !== 'string' || !title.trim()) {
                return res.status(400).json({
                    message: 'Article title cannot be empty.',
                });
            }

            article.title = title.trim();
        }

        // -----------------------------
        // CONTENT
        // -----------------------------

        if (content !== undefined) {
            if (typeof content !== 'string' || !content.trim()) {
                return res.status(400).json({
                    message: 'Article content cannot be empty.',
                });
            }

            article.content = content.trim();
        }

        // -----------------------------
        // CATEGORY
        // -----------------------------

        if (category !== undefined) {
            if (!mongoose.isValidObjectId(category)) {
                return res.status(400).json({
                    message: 'Invalid category ID.',
                });
            }

            article.category = category;
        }

        // -----------------------------
        // TAGS
        // -----------------------------

        if (tags !== undefined) {
            if (!Array.isArray(tags)) {
                return res.status(400).json({
                    message: 'Tags must be provided as an array.',
                });
            }

            const invalidTag = tags.find(
                (tag) => !mongoose.isValidObjectId(tag)
            );

            if (invalidTag) {
                return res.status(400).json({
                    message: 'Invalid tag ID.',
                    invalidTag,
                });
            }

            article.tags = tags;
        }

        // -----------------------------
        // QUIZ
        // -----------------------------

        if (quizEnabled !== undefined) {
            article.quizEnabled = Boolean(quizEnabled);
        }

        if (quiz !== undefined) {
            article.quiz = quiz;
        }

        // -----------------------------
        // IMAGE
        // -----------------------------

        if (image !== undefined) {
            article.image = image;
        }

        // -----------------------------
        // STATUS
        // -----------------------------

        if (status !== undefined) {
            const allowedStatuses = [
                'Draft',
                'Pending',
                'Approved',
                'Published',
                'Rejected',
                'Changes Requested',
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: 'Invalid article status.',
                });
            }

            article.status = status;
        }

        // -----------------------------
        // ADMIN NOTE
        // -----------------------------

        if (adminNote !== undefined) {
            article.adminNote = adminNote;
        }

        await article.save();

        const updatedArticle = await populateArticle(
            Article.findById(article._id)
        );

        return res.status(200).json({
            message: 'Article updated successfully.',
            article: updatedArticle,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// DELETE ARTICLE - ADMIN
// ======================================================

export async function deleteArticle(req, res, next) {
    try {
        const article = await Article.findByIdAndDelete(
            req.params.id
        );

        if (!article) {
            return res.status(404).json({
                message: 'Article not found.',
            });
        }

        return res.status(200).json({
            message: 'Article deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// SUBMIT ARTICLE FOR REVIEW
// ======================================================

export async function submitArticle(req, res, next) {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                message: 'Article not found.',
            });
        }

        article.status = 'Pending';

        await article.save();

        const submittedArticle = await populateArticle(
            Article.findById(article._id)
        );

        return res.status(200).json({
            message: 'Article submitted for review successfully.',
            article: submittedArticle,
        });
    } catch (error) {
        next(error);
    }
}


// ======================================================
// GET APPROVED + PUBLISHED ARTICLES - ADMIN
// ======================================================

export async function getApprovedArticles(req, res, next) {
    try {
        const articles = await populateArticle(
            Article.find({
                status: {
                    $in: ['Approved', 'Published'],
                },
            }).sort({ updatedAt: -1 })
        );

        return res.status(200).json({
            articles,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// PUBLISH APPROVED ARTICLE - ADMIN
// Approved -> Published
// ======================================================

export async function publishArticle(req, res, next) {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                message: 'Article not found.',
            });
        }

        if (article.status !== 'Approved') {
            return res.status(400).json({
                message: 'Only approved articles can be published.',
            });
        }

        article.status = 'Published';

        await article.save();

        const publishedArticle = await populateArticle(
            Article.findById(article._id)
        );

        return res.status(200).json({
            message: 'Article published successfully.',
            article: publishedArticle,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// UNPUBLISH ARTICLE - ADMIN
// Published -> Approved
// ======================================================

export async function unpublishArticle(req, res, next) {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                message: 'Article not found.',
            });
        }

        if (article.status !== 'Published') {
            return res.status(400).json({
                message: 'Only published articles can be unpublished.',
            });
        }

        article.status = 'Approved';

        await article.save();

        const unpublishedArticle = await populateArticle(
            Article.findById(article._id)
        );

        return res.status(200).json({
            message: 'Article unpublished successfully.',
            article: unpublishedArticle,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// GET APPROVED / PUBLISHED QUIZZES - ADMIN
// ======================================================

export async function getApprovedQuizzes(req, res, next) {
    try {
        const articles = await populateArticle(
            Article.find({
                status: { $in: ['Approved', 'Published'] },
                quizEnabled: true,
                'quiz.questions.0': { $exists: true },
            }).sort({ updatedAt: -1 })
        );

        return res.status(200).json({
            quizzes: articles,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// GET QUIZ OF ONE ARTICLE - ADMIN
// ======================================================

export async function getArticleQuiz(req, res, next) {
    try {
        const article = await populateArticle(
            Article.findOne({
                _id: req.params.id,
                status: { $in: ['Approved', 'Published'] },
            })
        );
        if (!article) {
            return res.status(404).json({
                message: 'Approved or published article not found.',
            });
        }

        return res.status(200).json({
            quiz: article.quiz,
            article,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// UPDATE QUIZ - ADMIN
// ======================================================

export async function updateArticleQuiz(req, res, next) {
    try {
        const { quizEnabled, questions } = req.body;

        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                message: 'Article not found.',
            });
        }

        if (!['Approved', 'Published'].includes(article.status)) {
            return res.status(400).json({
                message:
                    'Quiz can only be managed for approved or published articles.',
            });
        }

        if (quizEnabled !== undefined) {
            article.quizEnabled = Boolean(quizEnabled);
        }

        if (questions !== undefined) {
            if (!Array.isArray(questions)) {
                return res.status(400).json({
                    message: 'Quiz questions must be an array.',
                });
            }

            if (questions.length === 0 && article.quizEnabled) {
                return res.status(400).json({
                    message:
                        'Quiz must contain at least one question when enabled.',
                });
            }

            article.quiz = {
                questions,
            };
        }

        await article.save();

        const updatedArticle = await populateArticle(
            Article.findById(article._id)
        );

        return res.status(200).json({
            message: 'Quiz updated successfully.',
            quiz: updatedArticle.quiz,
            article: updatedArticle,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// DELETE / DISABLE QUIZ - ADMIN
// ======================================================

export async function deleteArticleQuiz(req, res, next) {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                message: 'Article not found.',
            });
        }

        if (!['Approved', 'Published'].includes(article.status)) {
            return res.status(400).json({
                message:
                    'Quiz can only be managed for approved or published articles.',
            });
        }

        // Disable quiz but keep all questions
        article.quizEnabled = false;

        await article.save();

        return res.status(200).json({
            message: 'Quiz disabled successfully.',
            quiz: article.quiz,
            article,
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// ENABLE QUIZ - ADMIN
// ======================================================

export async function enableArticleQuiz(req, res, next) {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                message: 'Article not found.',
            });
        }

        if (!['Approved', 'Published'].includes(article.status)) {
            return res.status(400).json({
                message:
                    'Quiz can only be managed for approved or published articles.',
            });
        }

        if (!article.quiz?.questions?.length) {
            return res.status(400).json({
                message:
                    'Cannot enable quiz because it has no questions.',
            });
        }

        article.quizEnabled = true;

        await article.save();

        return res.status(200).json({
            message: 'Quiz enabled successfully.',
            quiz: article.quiz,
            article,
        });
    } catch (error) {
        next(error);
    }
}
// ======================================================
// ENABLE QUIZ - ADMIN
// ======================================================


// ======================================================
// GET DISABLED QUIZZES - ADMIN
// ======================================================

export async function getDisabledQuizzes(req, res, next) {
    try {
        const articles = await populateArticle(
            Article.find({
                status: { $in: ['Approved', 'Published'] },
                quizEnabled: false,
                'quiz.questions.0': { $exists: true },
            }).sort({ updatedAt: -1 })
        );

        return res.status(200).json({
            quizzes: articles,
        });
    } catch (error) {
        next(error);
    }
}