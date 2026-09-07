import { Router } from 'express';
import { getQuiz, submitAttempt, updateQuiz } from '../controllers/quizController.js';
import { allowRoles, requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/article/:articleId', getQuiz);
router.post('/article/:articleId/attempts', requireAuth, submitAttempt);
router.patch('/article/:articleId', requireAuth, allowRoles('admin'), updateQuiz);
export default router;
