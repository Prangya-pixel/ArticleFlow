import express from 'express';
import {
  createTag,
  getTags,
  updateTag,
  deleteTag,
} from '../controllers/tagController.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, allowRoles('admin'), getTags);
router.post('/', requireAuth, allowRoles('admin'), createTag);
router.put('/:id', requireAuth, allowRoles('admin'), updateTag);
router.delete('/:id', requireAuth, allowRoles('admin'), deleteTag);

export default router;