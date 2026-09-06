import { Router } from 'express';
import { getPublicProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:userId/profile', requireAuth, getPublicProfile);

export default router;