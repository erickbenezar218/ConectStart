import { Router } from 'express'
import { calculate, listNeighborhoodRules, upsertRule } from '../controllers/pricingController'

const router = Router()

router.post('/calculate', calculate)
router.get('/neighborhoods', listNeighborhoodRules)
router.post('/neighborhoods', upsertRule)

export default router
