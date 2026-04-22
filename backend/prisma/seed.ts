import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding...')

  // Default admin user
  const adminEmail = 'admin@conectflow.com'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: await bcrypt.hash('Admin@123', 12),
        role: 'ADMIN',
      },
    })
    console.log('Admin user created: admin@conectflow.com / Admin@123')
  } else {
    console.log('Admin user already exists.')
  }

  // Neighborhood rules
  const neighborhoods = [
    { neighborhood: 'Centro', adhesionFee: 0, isSpecial: false },
    { neighborhood: 'Jardim América', adhesionFee: 50, isSpecial: false },
    { neighborhood: 'Vila Nova', adhesionFee: 50, isSpecial: false },
    { neighborhood: 'Bela Vista', adhesionFee: 100, isSpecial: true },
    { neighborhood: 'São João', adhesionFee: 100, isSpecial: false },
    { neighborhood: 'Zona Rural', adhesionFee: 200, isSpecial: true, overrideFee: 300, notes: 'Bairro de difícil acesso' },
    { neighborhood: 'Condomínio Fechado', adhesionFee: 150, isSpecial: true, overrideFee: 0, notes: 'Taxa negociada com condomínio' },
  ]

  for (const rule of neighborhoods) {
    await prisma.neighborhoodRule.upsert({
      where: { neighborhood: rule.neighborhood },
      update: rule,
      create: rule,
    })
  }

  console.log('Seed completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
