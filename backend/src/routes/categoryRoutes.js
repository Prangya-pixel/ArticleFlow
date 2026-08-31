import express from 'express';
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, allowRoles('admin'), getCategories);
router.post('/', requireAuth, allowRoles('admin'), createCategory);
router.put('/:id', requireAuth, allowRoles('admin'), updateCategory);
router.delete('/:id', requireAuth, allowRoles('admin'), deleteCategory);

export default router;