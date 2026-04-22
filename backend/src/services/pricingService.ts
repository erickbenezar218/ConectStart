import { prisma } from '../config/database'
import { PricingCalculationRequest, PricingCalculationResult } from '../types'

const DISTANCE_FREE_THRESHOLD = 150  // meters
const DISTANCE_BASE_FEE = 50         // R$50 up to 150m
const DISTANCE_EXTRA_PER_METER = 1   // R$1 per extra meter

// Adhesion fee rules
const ADHESION_FIDELITY_DEFAULT = 50    // fidelidade padrão
const ADHESION_FIDELITY_SPECIAL = 100   // fidelidade bairros especiais
const ADHESION_NO_FIDELITY = 300        // sem fidelidade (qualquer bairro)

// Neighborhoods that cost R$100 with fidelity (match substring, case-insensitive)
const SPECIAL_FIDELITY_NEIGHBORHOODS = [
  'BELA VISTA',
  'MAIAPOLIS',
  'FÉ EM DEUS',
  'FE EM DEUS', // without accent fallback
]

export async function calculatePricing(
  req: PricingCalculationRequest
): Promise<PricingCalculationResult> {
  const { neighborhood, distance, contractType } = req

  let adhesionFee: number
  let isSpecialNeighborhood = false
  let notes: string | undefined

  if (contractType === 'NO_FIDELITY') {
    adhesionFee = ADHESION_NO_FIDELITY
    notes = 'Taxa sem fidelidade'
  } else {
    // FIDELITY — check if special neighborhood
    const neighborhoodUpper = neighborhood.toUpperCase()
    isSpecialNeighborhood = SPECIAL_FIDELITY_NEIGHBORHOODS.some((s) =>
      neighborhoodUpper.includes(s.toUpperCase())
    )
    adhesionFee = isSpecialNeighborhood ? ADHESION_FIDELITY_SPECIAL : ADHESION_FIDELITY_DEFAULT
  }

  const distanceFee = calculateDistanceFee(distance)
  const totalSetup = adhesionFee + distanceFee

  const breakdown: { label: string; value: number }[] = []
  breakdown.push({ label: 'Taxa de adesão', value: adhesionFee })
  if (distanceFee > 0) {
    breakdown.push({ label: `Taxa de distância (${distance}m)`, value: distanceFee })
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
  return DISTANCE_BASE_FEE + (distance - DISTANCE_FREE_THRESHOLD) * DISTANCE_EXTRA_PER_METER
}

export async function getNeighborhoodRules() {
  return prisma.neighborhoodRule.findMany({ orderBy: { neighborhood: 'asc' } })
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
