import { Router } from 'express'
import {
  getSpamApprovalQueue,
  approveSpamContent,
  rejectSpamContent
} from '../controllers/spamApprovalController.js'
import { requireAuth, allowRoles } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, allowRoles('admin'))

router.get('/queue', getSpamApprovalQueue)
router.patch('/queue/:id/approve', approveSpamContent)
router.patch('/queue/:id/reject', rejectSpamContent)

export default router