import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'path'

import { connectDatabase, disconnectDatabase } from './config/database'
import { errorHandler, notFound } from './middleware/errorHandler'
import { authenticate } from './middleware/auth'
import { createLead } from './controllers/leadsController'

import leadsRouter from './routes/leads'
import plansRouter from './routes/plans'
import pricingRouter from './routes/pricing'
import uploadsRouter from './routes/uploads'
import authRouter from './routes/auth'
import usersRouter from './routes/users'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// --- Public routes ---
app.use('/api/auth', authRouter)
app.use('/api/plans', plansRouter)
app.use('/api/pricing', pricingRouter)
app.use('/api/uploads', uploadsRouter)

// Public: submit registration from wizard (no auth needed)
app.post('/api/leads', createLead)

// Protected: all other lead operations require auth
app.use('/api/leads', authenticate, leadsRouter)
app.use('/api/users', usersRouter)

app.use(notFound)
app.use(errorHandler)

async function bootstrap() {
  await connectDatabase()

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 ConectFlow API running`)
    console.log(`   http://localhost:${PORT}`)
    console.log(`   Health: http://localhost:${PORT}/health\n`)
  })

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
