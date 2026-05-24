import { useNotificationsStore } from '../../store/notifications.store'
import { markNotificationsRead } from '../../api/notifications.api'
import { formatRelative } from '../../utils/format'
import { Bell } from 'lucide-react'

interface NotificationDropdownProps {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAllRead } = useNotificationsStore()

  const handleMarkRead = async () => {
    try {
      await markNotificationsRead()
    } catch {
      // silent
    }
    markAllRead()
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
        <button
          onClick={handleMarkRead}
          className="text-xs text-primary hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Bell className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notif) => (
            <div
              key={notif.id}
              onClick={onClose}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                !notif.read ? 'bg-green-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{notif.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelative(notif.created_at)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
