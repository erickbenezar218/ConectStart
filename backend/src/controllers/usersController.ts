import { Response } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth'

const prisma = new PrismaClient()

export const listUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, lastLogin: true, createdAt: true, createdBy: true,
      },
    })
    res.json({ success: true, data: users })
  } catch {
    res.status(500).json({ success: false, error: 'Erro ao listar usuários' })
  }
}

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Nome, e-mail e senha são obrigatórios' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      res.status(400).json({ success: false, error: 'E-mail já cadastrado' })
      return
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, error: 'Senha deve ter no mínimo 8 caracteres' })
      return
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashed,
        role: role || 'COMERCIAL',
        createdBy: req.user?.id,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })

    res.status(201).json({ success: true, data: user })
  } catch {
    res.status(500).json({ success: false, error: 'Erro ao criar usuário' })
  }
}

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, role, isActive, password } = req.body

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' })
      return
    }

    // Prevent removing the only admin
    if (user.role === 'ADMIN' && role && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } })
      if (adminCount <= 1) {
        res.status(400).json({ success: false, error: 'Não é possível remover o único administrador' })
        return
      }
    }

    const data: any = {}
    if (name) data.name = name.trim()
    if (role) data.role = role
    if (isActive !== undefined) data.isActive = isActive
    if (password) {
      if (password.length < 8) {
        res.status(400).json({ success: false, error: 'Senha deve ter no mínimo 8 caracteres' })
        return
      }
      data.password = await bcrypt.hash(password, 12)
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    })

    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: 'Erro ao atualizar usuário' })
  }
}
