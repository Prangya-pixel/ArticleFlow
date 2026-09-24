import { Router } from 'express';
import {
  evaluateContent,
  getModerationQueue,
  submitDecision,
  getThresholds,
  updateThresholds,
  reinstateContent,
  getModerationStats
} from '../controllers/moderationController.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();

// Evaluate content pipeline (accessible by authenticated users/submission pipeline or admins)
router.post('/evaluate/:contentId', requireAuth, evaluateContent);

// Admin-only moderation endpoints
router.use(requireAuth, allowRoles('admin'));

// Queue of items pending review
router.get('/queue', getModerationQueue);

// Live statistics for dashboard & threshold preview
router.get('/stats', getModerationStats);

// Manual override decision (approve / reject)
router.patch('/:contentId/decision', submitDecision);

// Thresholds configuration
router.get('/thresholds', getThresholds);
router.put('/thresholds', updateThresholds);

// Reinstatement for Module 5 appeal integration
router.post('/reinstate/:contentId', reinstateContent);

export default router;
