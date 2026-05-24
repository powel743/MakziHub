import Redis from 'ioredis'
import { env } from './env'
import logger from '../utils/logger'

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error({ err }, 'Redis error'))
redis.on('close', () => logger.warn('Redis connection closed'))

export async function connectRedis(): Promise<void> {
  // ioredis connects automatically
}

export default redis
