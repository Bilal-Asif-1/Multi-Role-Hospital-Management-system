import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { ArrowLeft } from 'lucide-react'

type Step = 'email' | 'code-and-password'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }
    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim())
      toast.success('Check your email for the reset code.')
      setStep('code-and-password')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error('Please enter the code from your email')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(email.trim(), otp.trim(), newPassword)
      toast.success('Password reset successfully. You can now login.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Try again.')
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
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'email'
              ? 'Enter your email to receive a reset code'
              : 'Enter the code from your email and set a new password'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-black">
          {step === 'email' ? (
            <form className="space-y-6" onSubmit={handleSendCode}>
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
                  className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border-2 border-black text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 font-bold"
              >
                {loading ? 'Sending...' : 'Send reset code'}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <p className="text-sm text-gray-600">
                Code sent to <strong>{email}</strong>. Check your inbox.
              </p>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-black mb-2 font-bold">
                  Verification code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm tracking-widest text-center"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-black mb-2 font-bold">
                  New password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2 font-bold">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-400 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black sm:text-sm"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border-2 border-black text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 font-bold"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4" />
                Use a different email
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-black hover:text-gray-700 font-bold"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
