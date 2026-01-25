import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../../../services/api'
import { Bell, Calendar, FlaskConical, Pill, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface PatientNotificationsProps {
  notifications: any[]
  queryClient: any
}

export default function PatientNotifications({ notifications, queryClient }: PatientNotificationsProps) {
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'LAB_RESULT':
        return <FlaskConical className="h-5 w-5 text-purple-500" />
      case 'PRESCRIPTION':
        return <Pill className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-black rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          {notifications && notifications.length > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 font-bold"
            >
              Mark All as Read
            </button>
          )}
        </div>
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
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getNotificationIcon(notif.type)}
                  </div>
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
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Mark Read
                    </button>
                  )}
                  {notif.isRead && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



