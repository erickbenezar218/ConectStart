import { Router } from 'express'
import { listPlans, listBillingDates, listPops, refreshCache } from '../controllers/plansController'

const router = Router()

router.get('/', listPlans)
router.get('/billing-dates', listBillingDates)
router.get('/pops', listPops)
router.post('/cache/refresh', refreshCache)

export default router
