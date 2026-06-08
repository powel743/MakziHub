import client from './client'
import type { Notification } from '../utils/constants'

export const getNotifications = async (): Promise<Notification[]> => {
  const res = await client.get('/notifications')
  return res.data.notifications || res.data.data || []
}

export const markNotificationsRead = async () => {
  await client.post('/notifications/mark-all-read')
}
