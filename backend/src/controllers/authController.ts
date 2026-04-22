import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const JWT_EXPIRES = '8h'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Credenciais inválidas' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ success: false, error: 'Credenciais inválidas' })
      return
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, error: 'Erro interno' })
  }
}

export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    })

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Usuário não encontrado ou inativo' })
      return
    }

    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno' })
  }
}

export const logout = (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logout realizado' })
}
