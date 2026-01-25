import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface NotificationsCenterProps {
  notifications: any[]
  queryClient: any
}

export default function NotificationsCenter({ notifications, queryClient }: NotificationsCenterProps) {
  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
      toast.success('All notifications marked as read')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Notifications Center</h2>
        {notifications && notifications.length > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Mark All as Read
          </button>
        )}
      </div>
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((notif: any) => (
              <div
                key={notif.id}
                className={`p-4 rounded-lg border ${
                  notif.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(notif.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsReadMutation.mutate(notif.id)}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No notifications</p>
          )}
        </div>
      </div>
    </div>
  )
}



