import { Router, Request, Response, NextFunction } from 'express'
import { upload, getFileUrl } from '../middleware/upload'
import { AppError } from '../middleware/errorHandler'

const router = Router()

router.post(
  '/photo',
  upload.single('photo'),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.file) {
        throw new AppError('Nenhum arquivo enviado', 400)
      }
      const url = getFileUrl(req, req.file.filename)
      res.json({
        success: true,
        data: {
          filename: req.file.filename,
          url,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
