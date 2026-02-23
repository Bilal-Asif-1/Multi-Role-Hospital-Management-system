import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usersApi, authApi } from '../services/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

interface ValidationErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  otp?: string
}

export default function Register() {
  const [step, setStep] = useState<'email' | 'otp' | 'register'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'PATIENT' as 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [adminExists, setAdminExists] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const { register, login, user: currentUser } = useAuth()
  const navigate = useNavigate()

  // Validation functions
  const validateFirstName = (firstName: string): string | undefined => {
    if (!firstName.trim()) {
      return 'First name is required'
    }
    if (firstName.trim().length < 2) {
      return 'First name must be at least 2 characters'
    }
    if (firstName.trim().length > 50) {
      return 'First name must be less than 50 characters'
    }
    if (!/^[a-zA-Z\s'-]+$/.test(firstName.trim())) {
      return 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }
    return undefined
  }

  const validateLastName = (lastName: string): string | undefined => {
    if (!lastName.trim()) {
      return 'Last name is required'
    }
    if (lastName.trim().length < 2) {
      return 'Last name must be at least 2 characters'
    }
    if (lastName.trim().length > 50) {
      return 'Last name must be less than 50 characters'
    }
    if (!/^[a-zA-Z\s'-]+$/.test(lastName.trim())) {
      return 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }
    return undefined
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address'
    }
    if (email.trim().length > 100) {
      return 'Email must be less than 100 characters'
    }
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required'
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    if (password.length > 100) {
      return 'Password must be less than 100 characters'
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return 'Password must contain at least one letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    return undefined
  }

  const validateConfirmPassword = (confirm: string, password: string): string | undefined => {
    if (!confirm.trim()) return 'Please confirm your password'
    if (confirm !== password) return 'Passwords do not match'
    return undefined
  }

  const validateOtp = (otp: string): string | undefined => {
    if (!otp) {
      return 'OTP is required'
    }
    if (!/^\d{6}$/.test(otp)) {
      return 'OTP must be a 6-digit number'
    }
    return undefined
  }

  // Check if admin already exists
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const result = await usersApi.checkAdminExists()
        setAdminExists(result.exists)
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
        setAdminExists(false)
      } finally {
        setCheckingAdmin(false)
      }
    }
    checkAdmin()
  }, [])

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpCountdown])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSendOtp = async () => {
    const emailError = validateEmail(email)
    if (emailError) {
      setErrors({ email: emailError })
      setTouched({ email: true })
      return
    }

    setSendingOtp(true)
    setErrors({})
    try {
      await authApi.sendOtp(email.trim())
      setOtpSent(true)
      setOtpCountdown(600) // 10 minutes
      setResendCooldown(60) // 1 minute cooldown
      setStep('otp')
      toast.success('Verification code sent to your email. Please check your inbox.')
    } catch (error: any) {
      console.error('Send OTP error:', error)
      console.error('Error response:', error.response)
      console.error('Error response data:', error.response?.data)
      console.error('Error message:', error.message)
      
      // Extract error message from various possible formats
      let errorMessage = 'Failed to send OTP. Please try again.'
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ')
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setErrors({ email: errorMessage })
      toast.error(errorMessage)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    const otpError = validateOtp(otp)
    if (otpError) {
      setErrors({ otp: otpError })
      setTouched({ otp: true })
      return
    }

    setVerifyingOtp(true)
    setErrors({})
    try {
      await authApi.verifyOtp(email.trim(), otp.trim().replace(/\D/g, '').slice(0, 6))
      setEmailVerified(true)
      setFormData((prev) => ({ ...prev, firstName: '', lastName: '', password: '', confirmPassword: '' }))
      setStep('register')
      toast.success('Email verified successfully!')
    } catch (error: any) {
      console.error('Verify OTP error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Invalid OTP. Please try again.'
      setErrors({ otp: errorMessage })
      toast.error(errorMessage)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    
    setSendingOtp(true)
    setErrors({})
    try {
      await authApi.sendOtp(email.trim())
      setOtpCountdown(600) // Reset to 10 minutes
      setResendCooldown(60) // Reset cooldown
      setOtp('') // Clear OTP input
      toast.success('New verification code sent to your email.')
    } catch (error: any) {
      console.error('Resend OTP error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend OTP. Please try again.'
      toast.error(errorMessage)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emailVerified) {
      toast.error('Please verify your email first')
      return
    }

    setTouched({
      firstName: true,
      lastName: true,
      password: true,
      confirmPassword: true,
      role: true,
    })
    
    const newErrors: ValidationErrors = {}
    const firstNameError = validateFirstName(formData.firstName)
    if (firstNameError) newErrors.firstName = firstNameError
    
    const lastNameError = validateLastName(formData.lastName)
    if (lastNameError) newErrors.lastName = lastNameError
    
    const passwordError = validatePassword(formData.password)
    if (passwordError) newErrors.password = passwordError

    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password)
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors in the form')
      return
    }
    
    setLoading(true)
    try {
      const firstName = formData.firstName.trim()
      const lastName = formData.lastName.trim()
      const registrationData = {
        email: email.trim(),
        password: formData.password,
        firstName,
        lastName,
        role: formData.role as 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT',
      }
      if (!firstName || !lastName) {
        toast.error('Please enter first name and last name for the new account.')
        setLoading(false)
        return
      }

      const response = (await register(registrationData)) as { message?: string; user?: { id: string; email: string; firstName: string; lastName: string; role: string; isApproved?: boolean }; access_token?: string } | undefined
      
      if (response && typeof response === 'object' && response.user) {
        try {
          const { user: loggedInUser } = await login(email.trim(), formData.password, formData.role)
          toast.success(
            formData.role === 'ADMIN'
              ? 'Admin registration successful! Welcome to admin panel.'
              : 'Registration successful! Please complete your profile to submit for approval.'
          )
          const path = formData.role === 'ADMIN' ? '/admin' : '/settings'
          // Pass the newly logged-in user so Settings page shows correct profile (avoids stale auth context)
          if (formData.role === 'ADMIN') {
            setTimeout(() => navigate(path), 0)
          } else {
            navigate(path, { state: { registeredUser: loggedInUser } })
          }
        } catch (loginError: any) {
          console.error('Auto-login error:', loginError)
          toast.success('Registration successful! Please login.')
          setTimeout(() => navigate('/login'), 0)
        }
      } else {
        toast.success('Registration successful! Please login.')
        navigate('/login')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      const msg = error.response?.data?.message
      const message = Array.isArray(msg) ? msg.join(' ') : msg || error.message
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED') || error.message?.includes('Network Error')) {
        toast.error('Cannot connect to server. Please make sure the backend server is running on port 3000.')
      } else if (message) {
        toast.error(message)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === 'email' ? 'bg-black text-white' : email ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            1
          </div>
          <div className={`h-1 w-16 ${emailVerified ? 'bg-black' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === 'otp' ? 'bg-black text-white' : emailVerified ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
          <div className={`h-1 w-16 ${step === 'register' ? 'bg-black' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === 'register' ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            3
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-black">
          {/* Step 1: Email Entry */}
          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-black mb-2">Step 1: Enter Your Email</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We'll send a verification code to your email address.
                </p>
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
                  className={`appearance-none relative block w-full px-3 py-2.5 border-2 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    touched.email && errors.email
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-black focus:border-black'
                  }`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (touched.email) {
                      const error = validateEmail(e.target.value)
                      setErrors(prev => ({ ...prev, email: error }))
                    }
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, email: true }))
                    const error = validateEmail(email)
                    setErrors(prev => ({ ...prev, email: error }))
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !sendingOtp) {
                      handleSendOtp()
                    }
                  }}
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || !email.trim()}
                className="w-full flex justify-center py-2.5 px-4 border-2 border-black text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-bold"
              >
                {sendingOtp ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-black mb-2">Step 2: Verify Your Email</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {otpSent ? (
                    <>We've sent a 6-digit code to <strong>{email}</strong></>
                  ) : (
                    <>Enter the 6-digit verification code</>
                  )}
                </p>
                {otpCountdown > 0 && (
                  <p className="text-xs text-gray-500">
                    Code expires in: <strong>{formatTime(otpCountdown)}</strong>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit code you received on your email to continue.
                </p>
              </div>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-black mb-2 font-bold">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  className={`appearance-none relative block w-full px-3 py-2.5 border-2 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 sm:text-sm transition-all text-center text-2xl tracking-widest ${
                    touched.otp && errors.otp
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-black focus:border-black'
                  }`}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(value)
                    if (touched.otp) {
                      const error = validateOtp(value)
                      setErrors(prev => ({ ...prev, otp: error }))
                    }
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, otp: true }))
                    const error = validateOtp(otp)
                    setErrors(prev => ({ ...prev, otp: error }))
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !verifyingOtp && otp.length === 6) {
                      handleVerifyOtp()
                    }
                  }}
                  autoFocus
                />
                {touched.otp && errors.otp && (
                  <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otp.length !== 6}
                  className="flex-1 flex justify-center py-2.5 px-4 border-2 border-black text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-bold"
                >
                  {verifyingOtp ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify Code'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="px-4 py-2.5 border-2 border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                >
                  Change Email
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || sendingOtp}
                  className="text-sm text-black hover:text-gray-700 transition-colors font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Registration Form */}
          {step === 'register' && (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <h3 className="text-lg font-bold text-black mb-2">Step 3: Complete Your Registration</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Email verified: <strong className="text-green-600">{email}</strong>
                </p>
                {currentUser && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                    You are logged in as <strong>{currentUser.firstName} {currentUser.lastName}</strong>. Enter the name for this <strong>new</strong> account below.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-black mb-2 font-bold">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  autoComplete="off"
                  className={`appearance-none relative block w-full px-3 py-2.5 border-2 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    touched.firstName && errors.firstName
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-black focus:border-black'
                  }`}
                  placeholder="Enter first name for this account"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value })
                    if (touched.firstName) {
                      const error = validateFirstName(e.target.value)
                      setErrors(prev => ({ ...prev, firstName: error }))
                    }
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, firstName: true }))
                    const error = validateFirstName(formData.firstName)
                    setErrors(prev => ({ ...prev, firstName: error }))
                  }}
                />
                {touched.firstName && errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
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
                  autoComplete="off"
                  className={`appearance-none relative block w-full px-3 py-2.5 border-2 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                    touched.lastName && errors.lastName
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-black focus:border-black'
                  }`}
                  placeholder="Enter last name for this account"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value })
                    if (touched.lastName) {
                      const error = validateLastName(e.target.value)
                      setErrors(prev => ({ ...prev, lastName: error }))
                    }
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, lastName: true }))
                    const error = validateLastName(formData.lastName)
                    setErrors(prev => ({ ...prev, lastName: error }))
                  }}
                />
                {touched.lastName && errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black mb-2 font-bold">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className={`appearance-none relative block w-full px-3 py-2.5 pr-10 border-2 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                      touched.password && errors.password
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-black focus:border-black'
                    }`}
                    placeholder="Enter password (min 6 characters, must contain letters and numbers)"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      if (touched.password) {
                        const error = validatePassword(e.target.value)
                        setErrors(prev => ({ ...prev, password: error }))
                      }
                      if (touched.confirmPassword) {
                        const err = validateConfirmPassword(formData.confirmPassword, e.target.value)
                        setErrors(prev => ({ ...prev, confirmPassword: err }))
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, password: true }))
                      const error = validatePassword(formData.password)
                      setErrors(prev => ({ ...prev, password: error }))
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-black focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                {touched.password && !errors.password && formData.password && (
                  <p className="mt-1 text-sm text-green-600">✓ Password is valid</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2 font-bold">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className={`appearance-none relative block w-full px-3 py-2.5 pr-10 border-2 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 sm:text-sm transition-all ${
                      touched.confirmPassword && errors.confirmPassword
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-black focus:border-black'
                    }`}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value })
                      if (touched.confirmPassword) {
                        const error = validateConfirmPassword(e.target.value, formData.password)
                        setErrors(prev => ({ ...prev, confirmPassword: error }))
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, confirmPassword: true }))
                      const error = validateConfirmPassword(formData.confirmPassword, formData.password)
                      setErrors(prev => ({ ...prev, confirmPassword: error }))
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-black focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
                {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-1 text-sm text-green-600">✓ Passwords match</p>
                )}
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
                You&apos;ll complete your profile (phone, CNIC, gender, etc.) on the next page after registration.
              </p>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || checkingAdmin}
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
            </form>
          )}

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-sm font-medium text-black hover:text-gray-700 transition-colors font-bold"
            >
              Already have an account? <span className="underline">Sign in here</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
