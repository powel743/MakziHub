import './config/env' // Validate env first — will exit if invalid
import { buildApp } from './app'
import { connectRedis } from './config/redis'
import { registerCronJobs } from './jobs/schedulers/cron'
import logger from './utils/logger'

const PORT = parseInt(process.env.PORT ?? '3000', 10)
const HOST = '0.0.0.0'

async function main() {
  try {
    // Connect Redis
    await connectRedis()
    logger.info('Redis connected')

    // Build Fastify app
    const app = await buildApp()

    // Register cron jobs
    await registerCronJobs()
    logger.info('Cron jobs registered')

    // Start server
    await app.listen({ port: PORT, host: HOST })
    logger.info(`MakaziHub API running on http://${HOST}:${PORT}`)
    logger.info(`Swagger docs at http://${HOST}:${PORT}/docs`)
  } catch (err) {
    logger.error({ err }, 'Failed to start server')
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down gracefully')
  process.exit(0)
})

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection')
})

main()
