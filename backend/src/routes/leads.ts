import { Router } from 'express'
import {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  getKanban,
  getStats,
} from '../controllers/leadsController'

const router = Router()

router.get('/kanban', getKanban)
router.get('/stats', getStats)
router.get('/', getLeads)
router.post('/', createLead)
router.get('/:id', getLeadById)
router.patch('/:id/status', updateLeadStatus)

export default router
