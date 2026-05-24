import { FastifyInstance } from 'fastify'
import { authRoutes } from './auth/auth.routes'
import { listingsRoutes } from './listings/listings.routes'
import { inquiriesRoutes } from './inquiries/inquiries.routes'
import { paymentsRoutes } from './payments/payments.routes'
import { reviewsRoutes } from './reviews/reviews.routes'
import { agenciesRoutes } from './agencies/agencies.routes'
import { alertsRoutes } from './alerts/alerts.routes'
import { savesRoutes } from './saves/saves.routes'
import { reportsRoutes } from './reports/reports.routes'
import { notificationsRoutes } from './notifications/notifications.routes'
import { adminRoutes } from './admin/admin.routes'
import { escrowRoutes } from './escrow/escrow.routes'

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(authRoutes, { prefix: '/auth' })
  fastify.register(listingsRoutes, { prefix: '/listings' })
  fastify.register(inquiriesRoutes, { prefix: '/inquiries' })
  fastify.register(paymentsRoutes, { prefix: '/payments' })
  fastify.register(reviewsRoutes, { prefix: '/reviews' })
  fastify.register(agenciesRoutes, { prefix: '/agencies' })
  fastify.register(alertsRoutes, { prefix: '/alerts' })
  fastify.register(savesRoutes, { prefix: '/saves' })
  fastify.register(reportsRoutes, { prefix: '/reports' })
  fastify.register(notificationsRoutes, { prefix: '/notifications' })
  fastify.register(adminRoutes, { prefix: '/admin' })
  fastify.register(escrowRoutes, { prefix: '/escrow' })
}
