import { Request, Response, NextFunction } from 'express'
import {
  calculatePricing,
  getNeighborhoodRules,
  upsertNeighborhoodRule,
} from '../services/pricingService'
import { PricingCalculationRequest } from '../types'

export async function calculate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body: PricingCalculationRequest = req.body
    const result = await calculatePricing(body)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export async function listNeighborhoodRules(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rules = await getNeighborhoodRules()
    res.json({ success: true, data: rules })
  } catch (error) {
    next(error)
  }
}

export async function upsertRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await upsertNeighborhoodRule(req.body)
    res.json({ success: true, data: rule })
  } catch (error) {
    next(error)
  }
}
