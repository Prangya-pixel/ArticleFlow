import { Router } from 'express'
import {
  analyzeModeration,
  getModerationResults,
  getModerationResultById,
} from '../controllers/moderationController.js'
import { requireAuth, allowRoles } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, allowRoles('admin'))

router.post('/analyze', analyzeModeration)

router.get('/', getModerationResults)

router.get('/:id', getModerationResultById)

export default router