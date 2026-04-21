import { Request, Response, NextFunction } from 'express'
import { getPlans, getBillingDates, clearSGPCache } from '../services/sgpService'

export async function listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const plans = await getPlans()
    res.json({ success: true, data: plans })
  } catch (error) {
    next(error)
  }
}

export async function listBillingDates(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dates = await getBillingDates()
    res.json({ success: true, data: dates })
  } catch (error) {
    next(error)
  }
}

export async function refreshCache(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    clearSGPCache()
    const [plans, dates] = await Promise.all([getPlans(), getBillingDates()])
    res.json({
      success: true,
      message: 'Cache atualizado com sucesso',
      data: { plans: plans.length, billingDates: dates.length },
    })
  } catch (error) {
    next(error)
  }
}
