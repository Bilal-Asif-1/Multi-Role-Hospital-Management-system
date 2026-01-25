import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usersApi } from '../services/api'
import toast from 'react-hot-toast'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'PATIENT' as 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT',
  })
  const [loading, setLoading] = useState(false)
  const [adminExists, setAdminExists] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const { register, login } = useAuth()
  const navigate = useNavigate()

  // Check if admin already exists
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const result = await usersApi.checkAdminExists()
        setAdminExists(result.exists)
        // If admin exists and current role is ADMIN, change to PATIENT
        if (result.exists) {
          setFormData(prev => {
            if (prev.role === 'ADMIN') {
              return { ...prev, role: 'PATIENT' }
            }
            return prev
          })
        }
      } catch (error) {
        console.error('Error checking admin:', error)
        // On error, don't assume admin exists - let user try to register
        // Only set to true if we get a clear response that admin exists
        setAdminExists(false)
      } finally {
        setCheckingAdmin(false)
      }
    }
    checkAdmin()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const registrationData: any = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
      }

      const response = await register(registrationData)
      
      // If registration successful, handle based on approval status
      if (response && response.user) {
        // Admin users are auto-approved and can login immediately
        if (formData.role === 'ADMIN') {
          try {
            const loginResponse = await login(formData.email.trim(), formData.password)
            toast.success('Admin registration successful! Welcome to admin panel.')
            navigate('/admin')
          } catch (loginError: any) {
            console.error('Auto-login error:', loginError)
            toast.success('Admin registration successful! Please login.')
            navigate('/login')
          }
        } else {
          // For non-admin users: Always redirect to settings to complete profile
          // Profile completion will trigger the approval request
          try {
            const loginResponse = await login(formData.email.trim(), formData.password)
            toast.success('Registration successful! Please complete your profile to submit for approval.')
            navigate('/settings')
          } catch (loginError: any) {
            console.error('Auto-login error:', loginError)
            toast.success('Registration successful! Please login and complete your profile.')
            navigate('/login')
          }
        }
      } else {
        toast.success('Registration successful! Please login.')
        navigate('/login')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Check if it's a connection error
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED') || error.message?.includes('Network Error')) {
        toast.error('Cannot connect to server. Please make sure the backend server is running on port 3000.')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-black rounded-full flex items-center justify-center mb-3">
            <span className="text-white text-xl font-bold">IHIS</span>
          </div>
          <h2 className="text-2xl font-extrabold text-black">
            Create Account
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Join the Hospital Management System
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-black">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-black mb-2 font-bold">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-all"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-black mb-2 font-bold">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-all"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2 font-bold">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-all"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2.5 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-all"
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-black mb-2 font-bold">
                Register As
              </label>
              <select
                id="role"
                name="role"
                required
                className="block w-full px-3 py-2.5 border-2 border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                disabled={checkingAdmin}
              >
                {!adminExists && <option value="ADMIN">Admin</option>}
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="PATIENT">Patient</option>
              </select>
              {adminExists && (
                <p className="text-xs text-gray-500 mt-1">
                  Admin user already exists. Only one admin is allowed.
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500 text-center">
              You'll complete your profile details after registration.
            </p>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 border-2 border-black text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-bold"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-sm font-medium text-black hover:text-gray-700 transition-colors font-bold"
              >
                Already have an account? <span className="underline">Sign in here</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



