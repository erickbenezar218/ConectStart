import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'

import { connectDatabase, disconnectDatabase } from './config/database'
import { errorHandler, notFound } from './middleware/errorHandler'

import leadsRouter from './routes/leads'
import plansRouter from './routes/plans'
import pricingRouter from './routes/pricing'
import uploadsRouter from './routes/uploads'

const app = express()
const PORT = process.env.PORT || 3001

// --- Security & Middleware ---
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// --- Static files (uploads) ---
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// --- API Routes ---
app.use('/api/leads', leadsRouter)
app.use('/api/plans', plansRouter)
app.use('/api/pricing', pricingRouter)
app.use('/api/uploads', uploadsRouter)

// --- 404 & Error handlers ---
app.use(notFound)
app.use(errorHandler)

// --- Start ---
async function bootstrap() {
  await connectDatabase()

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 ConectFlow API running`)
    console.log(`   http://localhost:${PORT}`)
    console.log(`   Health: http://localhost:${PORT}/health\n`)
  })

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`)
    server.close(async () => {
      await disconnectDatabase()
      console.log('Server closed.')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch(console.error)
