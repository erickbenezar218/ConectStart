import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding neighborhood rules...')

  const neighborhoods = [
    { neighborhood: 'Centro', adhesionFee: 0, isSpecial: false },
    { neighborhood: 'Jardim América', adhesionFee: 50, isSpecial: false },
    { neighborhood: 'Vila Nova', adhesionFee: 50, isSpecial: false },
    { neighborhood: 'Bela Vista', adhesionFee: 100, isSpecial: false },
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
