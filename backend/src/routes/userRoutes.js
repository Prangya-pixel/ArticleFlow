import { Router } from 'express';
import { toggleFollow, getFollowStatus } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/:id/follow', getFollowStatus);
router.patch('/:id/follow', toggleFollow);

export default router;