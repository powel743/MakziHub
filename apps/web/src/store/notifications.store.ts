import { create } from 'zustand'
import type { Notification } from '../utils/constants'

interface NotificationsStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (n: Notification[]) => void
  markAllRead: () => void
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}))
