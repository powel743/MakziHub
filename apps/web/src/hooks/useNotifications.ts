import { useEffect } from 'react'
import { useNotificationsStore } from '../store/notifications.store'
import { useAuthStore } from '../store/auth.store'
import { getNotifications } from '../api/notifications.api'

const POLL_INTERVAL = 30000 // 30 seconds

export function useNotifications() {
  const { setNotifications, notifications, unreadCount, markAllRead } = useNotificationsStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchNotifications = async () => {
      try {
        const data = await getNotifications()
        setNotifications(data)
      } catch {
        // silent fail
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [isAuthenticated, setNotifications])

  return { notifications, unreadCount, markAllRead }
}
