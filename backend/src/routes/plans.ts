import { Router } from 'express'
import { listPlans, listBillingDates, refreshCache } from '../controllers/plansController'

const router = Router()

router.get('/', listPlans)
router.get('/billing-dates', listBillingDates)
router.post('/cache/refresh', refreshCache)

export default router
