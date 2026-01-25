import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../services/api'
import { Bell, Calendar, FlaskConical, Pill, CheckCircle, X, FileText, ClipboardList, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
    enabled: isOpen,
  })

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar className="h-4 w-4 text-black" />
      case 'LAB_RESULT':
        return <FlaskConical className="h-4 w-4 text-black" />
      case 'PRESCRIPTION':
        return <Pill className="h-4 w-4 text-black" />
      case 'VISIT_NOTE':
        return <FileText className="h-4 w-4 text-black" />
      case 'TASK':
        return <ClipboardList className="h-4 w-4 text-black" />
      case 'SALARY':
        return <Wallet className="h-4 w-4 text-black" />
      default:
        return <Bell className="h-4 w-4 text-black" />
    }
  }

  const handleNotificationClick = (notif: any) => {
    // Mark as read if unread
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif.id)
    }
    
    // Navigate to action URL if available
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-transparent z-50 max-h-[600px] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black">
        <h3 className="text-lg font-bold text-white">Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications && notifications.length > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="px-3 py-1 text-xs bg-white text-black rounded hover:bg-gray-100 font-bold"
            >
              Mark All as Read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {notifications && notifications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  notif.isRead ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold text-black ${notif.isRead ? '' : 'font-extrabold'}`}>
                      {notif.title}
                    </h4>
                    <p className="text-sm text-black mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(notif.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsReadMutation.mutate(notif.id)
                      }}
                      className="px-2 py-1 text-xs bg-black text-white rounded hover:bg-gray-900 font-bold flex-shrink-0"
                    >
                      Mark Read
                    </button>
                  )}
                  {notif.isRead && (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-black font-bold">No notifications</p>
          </div>
        )}
      </div>
    </div>
  )
}

