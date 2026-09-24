import { Router } from 'express';

import {
  createArticle,
  deleteArticle,
  getArticle,
  getReviewedArticles,
  getSavedArticles,
  listArticles,
  toggleLike,
  toggleSavedArticle,
  updateArticle,
  getSpamArticles,
  reviewSpamArticle,
} from '../controllers/articleController.js';

import {
  allowRoles,
  optionalAuth,
  requireAuth,
} from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listArticles);

router.get(
  '/saved',
  requireAuth,
  allowRoles('reader'),
  getSavedArticles
);

router.get(
  '/reviewed',
  requireAuth,
  allowRoles('admin'),
  getReviewedArticles
);

// Spam Content Approval
router.get(
  '/spam',
  requireAuth,
  allowRoles('admin'),
  getSpamArticles
);

router.patch(
  '/:id/spam-review',
  requireAuth,
  allowRoles('admin'),
  reviewSpamArticle
);

router.patch(
  '/:id/save',
  requireAuth,
  allowRoles('reader'),
  toggleSavedArticle
);

router.patch(
  '/:id/like',
  requireAuth,
  toggleLike
);

router.get(
  '/:id',
  optionalAuth,
  getArticle
);

router.post(
  '/',
  requireAuth,
  allowRoles('author'),
  createArticle
);

router.patch(
  '/:id',
  requireAuth,
  allowRoles('author'),
  updateArticle
);

router.delete(
  '/:id',
  requireAuth,
  allowRoles('author'),
  deleteArticle
);

export default router;