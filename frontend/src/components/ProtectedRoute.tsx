import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [checkingStorage, setCheckingStorage] = useState(true)

  // Check localStorage before redirecting - give time for AuthContext to restore
  useEffect(() => {
    if (!user && !loading) {
      // Double-check localStorage before redirecting
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        // User exists in localStorage, wait a bit for AuthContext to restore
        const timer = setTimeout(() => {
          setCheckingStorage(false)
        }, 100)
        return () => clearTimeout(timer)
      } else {
        // No user in localStorage, safe to redirect
        setCheckingStorage(false)
      }
    } else {
      setCheckingStorage(false)
    }
  }, [user, loading])

  if (loading || checkingStorage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Final check - if still no user after checking storage, redirect to login
  const storedToken = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  const hasStoredAuth = storedToken && storedUser

  if (!user && !hasStoredAuth) {
    return <Navigate to="/login" replace />
  }

  // If we have stored auth but user is null, wait a bit more
  if (!user && hasStoredAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  // Check if user is approved (unless they're admin or on settings page)
  if (user && user.role !== 'ADMIN' && user.isApproved === false) {
    const currentPath = window.location.pathname
    // Allow access to settings page for unapproved users to complete profile
    if (currentPath !== '/settings' && currentPath !== '/pending-approval') {
      // If profile not completed, redirect to settings
      if (user.profileCompleted === false) {
        return <Navigate to="/settings" replace />
      }
      // If profile completed, redirect to pending approval
      return <Navigate to="/pending-approval" replace />
    }
  }

  return <>{children}</>
}



