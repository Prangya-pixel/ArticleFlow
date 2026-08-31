import { Router } from 'express';
import {
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  requestChanges
} from '../controllers/verificationController.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, allowRoles('admin'));

router.get('/submissions', getPendingSubmissions);
router.patch('/submissions/:id/approve', approveSubmission);
router.patch('/submissions/:id/reject', rejectSubmission);
router.patch('/submissions/:id/request-changes', requestChanges);

export default router;