import { Router } from 'express'
import {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLead,
  deleteLead,
  getKanban,
  getStats,
  getDashboardStats,
} from '../controllers/leadsController'

const router = Router()

router.get('/kanban', getKanban)
router.get('/stats', getStats)
router.get('/dashboard-stats', getDashboardStats)
router.get('/', getLeads)
router.post('/', createLead)
router.get('/:id', getLeadById)
router.patch('/:id/status', updateLeadStatus)
router.patch('/:id', updateLead)
router.delete('/:id', deleteLead)

export default router
