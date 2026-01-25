import { useAuth } from '../contexts/AuthContext'

export function useRole() {
  const { user } = useAuth()
  
  return {
    isAdmin: user?.role === 'ADMIN',
    isDoctor: user?.role === 'DOCTOR',
    isNurse: user?.role === 'NURSE',
    isPatient: user?.role === 'PATIENT',
    role: user?.role,
    user,
  }
}



