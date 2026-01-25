import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { CheckCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isApproved = searchParams.get('approved') === 'true'

  // Show approval success message
  useEffect(() => {
    if (isApproved) {
      toast.success('Your account has been approved! Please login to continue.', {
        duration: 5000,
        icon: '✅',
      })
      // Remove the query parameter from URL
      navigate('/login', { replace: true })
    }
  }, [isApproved, navigate])

  // Handle browser back button - simple redirect without history manipulation
  useEffect(() => {
    // Only handle if user is not logged in and on login page
    if (!user && !authLoading && location.pathname === '/login') {
      let previousPath = document.referrer || window.location.href
      
      const handlePopState = () => {
        // Wait a moment for React Router to process navigation
        setTimeout(() => {
          // If still on login page after back button, redirect to landing
          // Only if referrer is not from an external site
          const currentPath = window.location.pathname
          if (currentPath === '/login') {
            // Redirect to landing page
            navigate('/', { replace: true })
          }
        }, 50)
      }

      window.addEventListener('popstate', handlePopState, { once: false })

      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [user, authLoading, navigate, location.pathname])

  // Redirect if already logged in (prevents back button from showing login when authenticated)
  useEffect(() => {
    if (!authLoading) {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (user || (storedToken && storedUser)) {
        const userData = user || JSON.parse(storedUser || '{}')
        
        // Check if user needs to complete profile or is pending approval
        if (userData.role !== 'ADMIN' && userData.isApproved === false) {
          // If profile not completed, redirect to settings to fill profile
          if (userData.profileCompleted === false) {
            navigate('/settings', { replace: true })
            return
          }
          // If profile completed but not approved, show pending approval page
          navigate('/pending-approval', { replace: true })
          return
        }
        
        // Redirect based on role
        if (userData.role === 'ADMIN') {
          navigate('/admin', { replace: true })
        } else if (userData.role === 'DOCTOR') {
          navigate('/doctor', { replace: true })
        } else if (userData.role === 'NURSE') {
          navigate('/nurse', { replace: true })
        } else if (userData.role === 'PATIENT') {
          navigate('/patient', { replace: true })
        }
      }
    }
  }, [user, authLoading, navigate])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Login successful!')
      
      // Get user from auth context after login
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      
      // Check if user needs to complete profile or is pending approval
      if (userData.role !== 'ADMIN' && userData.isApproved === false) {
        // If profile not completed, redirect to settings to fill profile
        if (userData.profileCompleted === false) {
          navigate('/settings')
          return
        }
        // If profile completed but not approved, show pending approval page
        navigate('/pending-approval')
        return
      }
      
      // Redirect based on role
      if (userData.role === 'ADMIN') {
        navigate('/admin')
      } else if (userData.role === 'DOCTOR') {
        navigate('/doctor')
      } else if (userData.role === 'NURSE') {
        navigate('/nurse')
      } else if (userData.role === 'PATIENT') {
        navigate('/patient')
      } else {
        navigate('/')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-black rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">IHIS</span>
          </div>
          <h2 className="text-3xl font-extrabold text-black">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-black">
          {isApproved && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-bold">Account Approved!</p>
                <p className="text-green-700 text-sm mt-1">
                  Your account has been approved by admin. Please login to access your dashboard.
                </p>
              </div>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2 font-bold">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-all"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2 font-bold">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-all"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border-2 border-black text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-bold"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/register"
                className="text-sm font-medium text-black hover:text-gray-700 transition-colors font-bold"
              >
                Don't have an account? <span className="underline">Register here</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



