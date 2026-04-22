import { Router } from 'express'
import { listUsers, createUser, updateUser } from '../controllers/usersController'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = Router()

router.use(authenticate)
router.get('/', listUsers)
router.post('/', requireAdmin, createUser)
router.patch('/:id', requireAdmin, updateUser)

export default router
