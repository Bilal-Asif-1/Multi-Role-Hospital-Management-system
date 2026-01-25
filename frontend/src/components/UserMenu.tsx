import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Receipt, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface UserMenuProps {
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT'
}

export default function UserMenu({ role }: UserMenuProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load profile image from localStorage
  useEffect(() => {
    const loadProfileImage = () => {
      if (user?.id) {
        const savedImage = localStorage.getItem(`profileImage_${user.id}`)
        if (savedImage) {
          setProfileImage(savedImage)
        } else {
          setProfileImage(null)
        }
      }
    }

    loadProfileImage()

    // Listen for storage changes (when image is updated in settings)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `profileImage_${user?.id}`) {
        loadProfileImage()
      }
    }

    // Listen for custom event (when image is updated in same tab)
    const handleCustomStorageChange = () => {
      loadProfileImage()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('profileImageUpdated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileImageUpdated', handleCustomStorageChange)
    }
  }, [user?.id])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsOpen(false)
  }

  return (
    <div className="relative h-full" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-full flex items-center gap-1.5 text-white/90 hover:text-white hover:bg-white/10 px-3 transition-colors"
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt={`${user?.firstName} ${user?.lastName}`}
            className="h-8 w-8 rounded-full object-cover border-2 border-white/30"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-white/80 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {role === 'PATIENT' && (
            <>
              <button
                onClick={() => {
                  navigate('/patient', { state: { activeTab: 'billing' } })
                  setIsOpen(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Receipt className="h-4 w-4" />
                <span>Invoices</span>
              </button>
              <button
                onClick={() => {
                  navigate('/patient', { state: { activeTab: 'settings' } })
                  setIsOpen(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
            </>
          )}
          {role === 'DOCTOR' && (
            <>
              <button
                onClick={() => {
                  navigate('/doctor/settings')
                  setIsOpen(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
            </>
          )}
          {role === 'NURSE' && (
            <>
              <button
                onClick={() => {
                  navigate('/nurse', { state: { activeTab: 'settings' }, replace: true })
                  setIsOpen(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
            </>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}

