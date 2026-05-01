import cron, { ScheduledTask } from 'node-cron'
import { processDueFollowUps } from './followUpService'

let cronJob: ScheduledTask | null = null

export function startCronJobs(): void {
  // Executa a cada 30 minutos
  cronJob = cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron] Executando processamento de follow-ups...')
    try {
      await processDueFollowUps()
    } catch (error) {
      console.error('[Cron] Erro no processamento de follow-ups:', error)
    }
  })

  console.log('⏰ [Cron] Scheduler de pós-venda iniciado (a cada 30 min)')
}

export function stopCronJobs(): void {
  if (cronJob) {
    cronJob.stop()
    cronJob = null
    console.log('[Cron] Scheduler de pós-venda parado')
  }
}
