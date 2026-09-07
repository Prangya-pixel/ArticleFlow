import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getUsers,
  getConversation,
  sendMessage
} from '../controllers/chatController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/users', getUsers);
router.get('/:userId', getConversation);
router.post('/:userId', sendMessage);

export default router;