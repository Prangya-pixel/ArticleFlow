import { Router } from 'express';
import { getQuiz, submitAttempt } from '../controllers/quizController.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/article/:articleId', getQuiz);
router.post('/article/:articleId/attempts', requireAuth, submitAttempt);
export default router;
