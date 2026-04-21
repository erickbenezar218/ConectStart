import { prisma } from '../config/database'
import { PricingCalculationRequest, PricingCalculationResult } from '../types'

const DISTANCE_FREE_THRESHOLD = 150 // meters
const DISTANCE_BASE_FEE = 50 // R$50 up to 150m
const DISTANCE_EXTRA_PER_METER = 1 // R$1 per extra meter
const DEFAULT_ADHESION_FEE = 100 // fallback

export async function calculatePricing(
  req: PricingCalculationRequest
): Promise<PricingCalculationResult> {
  const { neighborhood, distance } = req

  // 1. Get neighborhood rule from DB (or use default)
  const rule = await prisma.neighborhoodRule.findFirst({
    where: {
      neighborhood: {
        equals: neighborhood,
        mode: 'insensitive',
      },
    },
  })

  // Adhesion fee logic
  let adhesionFee = DEFAULT_ADHESION_FEE
  let isSpecialNeighborhood = false
  let notes: string | undefined

  if (rule) {
    isSpecialNeighborhood = rule.isSpecial
    if (rule.isSpecial && rule.overrideFee !== null && rule.overrideFee !== undefined) {
      adhesionFee = rule.overrideFee
      notes = rule.notes ?? undefined
    } else {
      adhesionFee = rule.adhesionFee
    }
  }

  // 2. Distance fee
  const distanceFee = calculateDistanceFee(distance)

  // 3. Total
  const totalSetup = adhesionFee + distanceFee

  // 4. Breakdown
  const breakdown: { label: string; value: number }[] = []

  if (adhesionFee > 0) {
    breakdown.push({ label: 'Taxa de adesão', value: adhesionFee })
  }
  if (distanceFee > 0) {
    breakdown.push({ label: 'Taxa de distância', value: distanceFee })
  }
  if (breakdown.length === 0) {
    breakdown.push({ label: 'Instalação gratuita', value: 0 })
  }

  return {
    adhesionFee,
    distanceFee,
    totalSetup,
    breakdown,
    isSpecialNeighborhood,
    notes,
  }
}

export function calculateDistanceFee(distance?: number): number {
  if (!distance || distance <= 0) return 0
  if (distance <= DISTANCE_FREE_THRESHOLD) return DISTANCE_BASE_FEE
  const extra = distance - DISTANCE_FREE_THRESHOLD
  return DISTANCE_BASE_FEE + extra * DISTANCE_EXTRA_PER_METER
}

export async function getNeighborhoodRules() {
  return prisma.neighborhoodRule.findMany({
    orderBy: { neighborhood: 'asc' },
  })
}

export async function upsertNeighborhoodRule(data: {
  neighborhood: string
  adhesionFee: number
  isSpecial?: boolean
  overrideFee?: number
  notes?: string
}) {
  return prisma.neighborhoodRule.upsert({
    where: { neighborhood: data.neighborhood },
    update: data,
    create: data,
  })
}
