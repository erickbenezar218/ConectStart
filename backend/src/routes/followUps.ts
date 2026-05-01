import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth'
import {
  listFollowUps,
  getFollowUpStats,
  updateFollowUpStatus,
  triggerManual,
  webhookCallback,
} from '../controllers/followUpController'

const router = Router()

// Callback público chamado pelo n8n após envio do WhatsApp
router.post('/webhook/callback', webhookCallback)

// Rotas protegidas
router.use(authenticate)
router.get('/stats', getFollowUpStats)
router.get('/', listFollowUps)
router.patch('/:id/status', updateFollowUpStatus)
router.post('/trigger', requireAdmin, triggerManual)

export default router
