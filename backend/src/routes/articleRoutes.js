import express from 'express';

import {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  submitArticle,
  getApprovedArticles,
  publishArticle,
  unpublishArticle,
  getApprovedQuizzes,
  getDisabledQuizzes,
  getArticleQuiz,
  updateArticleQuiz,
  deleteArticleQuiz,
  enableArticleQuiz,
  
} from '../controllers/articleController.js';

import {
  requireAuth,
  allowRoles,
} from '../middleware/auth.js';

const router = express.Router();

// ======================================================
// GET ALL ARTICLES - ADMIN
// ======================================================

router.get(
  '/',
  requireAuth,
  allowRoles('admin'),
  getAllArticles
);

// ======================================================
// GET APPROVED ARTICLES - ADMIN
// ======================================================

router.get(
  '/approved',
  requireAuth,
  allowRoles('admin'),
  getApprovedArticles
);

// ======================================================
// GET ALL APPROVED QUIZZES - ADMIN
// IMPORTANT: Must come before /:id
// ======================================================

router.get(
  '/quizzes',
  requireAuth,
  allowRoles('admin'),
  getApprovedQuizzes
);
// ======================================================
// GET DISABLED QUIZZES - ADMIN
// ======================================================

router.get(
    '/quizzes/disabled',
    requireAuth,
    allowRoles('admin'),
    getDisabledQuizzes
  );
// ======================================================
// GET QUIZ OF ONE APPROVED ARTICLE - ADMIN
// ======================================================

router.get(
  '/:id/quiz',
  requireAuth,
  allowRoles('admin'),
  getArticleQuiz
);

// ======================================================
// PUBLISH APPROVED ARTICLE - ADMIN
// Approved → Published
// ======================================================

router.put(
  '/:id/publish',
  requireAuth,
  allowRoles('admin'),
  publishArticle
);

// ======================================================
// UNPUBLISH ARTICLE - ADMIN
// Published → Approved
// ======================================================

router.put(
  '/:id/unpublish',
  requireAuth,
  allowRoles('admin'),
  unpublishArticle
);

// ======================================================
// UPDATE QUIZ OF APPROVED ARTICLE - ADMIN
// ======================================================

router.put(
  '/:id/quiz',
  requireAuth,
  allowRoles('admin'),
  updateArticleQuiz
);

// ======================================================
// DELETE QUIZ FROM APPROVED ARTICLE - ADMIN
// ======================================================

router.delete(
  '/:id/quiz',
  requireAuth,
  allowRoles('admin'),
  deleteArticleQuiz
);
// ======================================================
// ENABLE QUIZ - ADMIN
// ======================================================

router.put(
    '/:id/quiz/enable',
    requireAuth,
    allowRoles('admin'),
    enableArticleQuiz
  );
  

// ======================================================
// GET SINGLE ARTICLE - ADMIN
// ======================================================

router.get(
  '/:id',
  requireAuth,
  allowRoles('admin'),
  getArticleById
);

// ======================================================
// CREATE ARTICLE - ADMIN
// ======================================================

router.post(
  '/',
  requireAuth,
  allowRoles('admin'),
  createArticle
);

// ======================================================
// UPDATE ARTICLE - ADMIN
// ======================================================

router.put(
  '/:id',
  requireAuth,
  allowRoles('admin'),
  updateArticle
);

// ======================================================
// DELETE ARTICLE - ADMIN
// ======================================================

router.delete(
  '/:id',
  requireAuth,
  allowRoles('admin'),
  deleteArticle
);

// ======================================================
// SUBMIT ARTICLE FOR REVIEW - ADMIN
// ======================================================

router.patch(
  '/:id/submit',
  requireAuth,
  allowRoles('admin'),
  submitArticle
);

export default router;