import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  generate,
  list,
  getById,
  getByLeadId,
  dispatch,
  getPublicInfo,
  submitSignature,
  signatureUpload,
  remove,
} from '../controllers/contractsController'

const router = Router()

// --- Public routes (no auth) ---
router.get('/public/:token', getPublicInfo)
router.post(
  '/sign/:token',
  signatureUpload.fields([
    { name: 'selfie', maxCount: 1 },
    { name: 'documentPhoto', maxCount: 1 },
  ]),
  submitSignature
)

// --- Protected routes ---
router.use(authenticate)
router.get('/', list)
router.get('/lead/:leadId', getByLeadId)
router.get('/:id', getById)
router.post('/generate/:leadId', generate)
router.post('/:id/dispatch', dispatch)
router.delete('/:id', remove)

export default router
