import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; name: string }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    res.status(401).json({ success: false, error: 'Token não fornecido' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Token inválido ou expirado' })
  }
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Acesso restrito a administradores' })
    return
  }
  next()
}

export const requireSupervisorOrAbove = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!['ADMIN', 'SUPERVISOR'].includes(req.user?.role || '')) {
    res.status(403).json({ success: false, error: 'Acesso restrito a supervisores ou superior' })
    return
  }
  next()
}
