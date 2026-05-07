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
  getTemplateInfo,
  uploadTemplate,
  templateUpload,
  previewContract,
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
router.get('/template/info', getTemplateInfo)
router.post('/template/upload', templateUpload.single('template'), uploadTemplate)
router.get('/', list)
router.get('/lead/:leadId', getByLeadId)
router.get('/:id/preview', (req, res, next) => {
  // allow token via query string so browser can open in new tab
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`
  }
  next()
}, authenticate, previewContract)
router.get('/:id', getById)
router.post('/generate/:leadId', generate)
router.post('/:id/dispatch', dispatch)
router.delete('/:id', remove)

export default router
