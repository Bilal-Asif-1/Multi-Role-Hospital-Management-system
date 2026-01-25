import { useEffect, useState } from 'react'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../services/api'

export default function PendingApprovalPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(false)
  const [wasRejected, setWasRejected] = useState(false)
  const [initialProfileCompleted, setInitialProfileCompleted] = useState<boolean | null>(null)

  // Poll user profile to check if approved or rejected
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-check', user?.id],
    queryFn: async () => {
      try {
        return await authApi.getProfile()
      } catch (error) {
        console.error('Error checking user profile:', error)
        return null
      }
    },
    enabled: !!user?.id && !user?.isApproved,
    refetchInterval: 5000, // Check every 5 seconds
    refetchIntervalInBackground: true,
  })

  // Track initial profileCompleted status
  useEffect(() => {
    if (userProfile && initialProfileCompleted === null) {
      setInitialProfileCompleted(userProfile.profileCompleted)
    }
  }, [userProfile, initialProfileCompleted])

  // Check if user got approved and redirect to login
  useEffect(() => {
    if (userProfile && userProfile.isApproved === true && !isChecking && user?.isApproved === false) {
      setIsChecking(true)
      // User has been approved - show success message and redirect to login
      setTimeout(() => {
        logout()
        navigate('/login?approved=true', { replace: true })
      }, 1500)
    }
  }, [userProfile, user?.isApproved, logout, navigate, isChecking])

  // Check if user was rejected (profileCompleted changed from true to false)
  useEffect(() => {
    if (userProfile && initialProfileCompleted === true && userProfile.profileCompleted === false) {
      setWasRejected(true)
    }
  }, [userProfile, initialProfileCompleted])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Show rejection message if user was rejected
  if (wasRejected || (userProfile && initialProfileCompleted === true && userProfile.profileCompleted === false && !userProfile.isApproved)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8 border border-red-200">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                Registration Request Rejected
              </h1>
              <p className="text-lg text-red-600 mb-6 font-bold">
                Your registration request has been rejected by the administration team.
              </p>
              <div className="bg-red-50 rounded-lg p-6 mb-6 text-left border border-red-200">
                <h2 className="text-lg font-bold text-black mb-4">What can you do?</h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Please review your profile information and make any necessary corrections</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Update your profile and resubmit for review</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Ensure all required information is complete and accurate</span>
                  </li>
                </ul>
              </div>
              {user && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Registered as:</span> {user.role}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-bold">Email:</span> {user.email}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/settings')}
                  className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-900 transition-colors"
                >
                  Update Profile & Resubmit
                </button>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Logout
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Need help? Contact the administration team for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
              {user?.isApproved === false && user?.profileCompleted === false
                ? 'Profile Not Completed'
                : 'Your Request is Pending for Approval'}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {user?.isApproved === false && user?.profileCompleted === false
                ? 'Please complete your profile to submit for admin approval.'
                : 'Thank you for registering! Your account is currently under review by our administration team.'}
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="text-lg font-bold text-black mb-4">What happens next?</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Our admin team will review your registration details</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>You will receive access to the full portal once approved</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>This process typically takes 24-48 hours</span>
                </li>
              </ul>
            </div>
            {user && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Registered as:</span> {user.role}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-bold">Email:</span> {user.email}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/settings')}
                className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-900 transition-colors"
              >
                Complete Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Need help? Contact the administration team for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


