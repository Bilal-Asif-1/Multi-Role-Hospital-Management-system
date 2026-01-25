import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT'
  isApproved?: boolean
  profileCompleted?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Ensure user persists across navigation - restore from localStorage if lost
  useEffect(() => {
    const checkAndRestore = () => {
      if (!user && !loading) {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        if (storedToken && storedUser) {
          try {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
          } catch (error) {
            console.error('Error restoring user from localStorage:', error)
          }
        }
      }
    }
    
    // Check immediately
    checkAndRestore()
    
    // Also check on focus (when user comes back to tab)
    window.addEventListener('focus', checkAndRestore)
    
    return () => {
      window.removeEventListener('focus', checkAndRestore)
    }
  }, [user, loading])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    setToken(response.access_token)
    setUser(response.user)
    localStorage.setItem('token', response.access_token)
    localStorage.setItem('user', JSON.stringify(response.user))
  }

  const register = async (data: any) => {
    const response = await authApi.register(data)
    // If registration requires approval, don't set token/user
    if (response.message && !response.access_token) {
      // Registration successful but needs approval
      return response
    }
    setToken(response.access_token)
    setUser(response.user)
    localStorage.setItem('token', response.access_token)
    localStorage.setItem('user', JSON.stringify(response.user))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}



